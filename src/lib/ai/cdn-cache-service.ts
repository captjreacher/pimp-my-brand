import { supabase } from '@/integrations/supabase/client'

export interface CacheEntry {
  key: string
  url: string
  contentType: string
  size: number
  expiresAt: string
  metadata?: Record<string, any>
}

export interface CacheStats {
  totalEntries: number
  totalSize: number
  hitRate: number
  topAssets: Array<{
    key: string
    hits: number
    size: number
  }>
}

export class CDNCacheService {
  private readonly bucketName = 'ai-generated-assets'
  private readonly cdnBaseUrl = import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public/'
  private readonly defaultTTL = 7 * 24 * 60 * 60 * 1000 // 7 days

  async cacheAsset(
    key: string,
    data: Blob | File,
    contentType: string,
    metadata?: Record<string, any>,
    ttl?: number
  ): Promise<string> {
    try {
      // Upload to Supabase Storage
      const filePath = `cached/${key}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, data, {
          contentType,
          cacheControl: `max-age=${(ttl || this.defaultTTL) / 1000}`,
          upsert: true
        })

      if (uploadError) throw uploadError

      const publicUrl = `${this.cdnBaseUrl}${this.bucketName}/${filePath}`

      // Store cache entry in database
      const expiresAt = new Date(Date.now() + (ttl || this.defaultTTL)).toISOString()
      
      await supabase
        .from('ai_cache_entries')
        .upsert({
          cache_key: key,
          url: publicUrl,
          content_type: contentType,
          size: data.size,
          expires_at: expiresAt,
          metadata: metadata || {},
          hits: 0,
          last_accessed: new Date().toISOString()
        })

      return publicUrl
    } catch (error) {
      console.error('Failed to cache asset:', error)
      throw error
    }
  }

  async getCachedAsset(key: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('ai_cache_entries')
        .select('*')
        .eq('cache_key', key)
        .single()

      if (error || !data) return null

      // Check if expired
      if (new Date(data.expires_at) < new Date()) {
        await this.invalidateCache(key)
        return null
      }

      // Update hit count and last accessed
      await supabase
        .from('ai_cache_entries')
        .update({
          hits: data.hits + 1,
          last_accessed: new Date().toISOString()
        })
        .eq('cache_key', key)

      return data.url
    } catch (error) {
      console.error('Failed to get cached asset:', error)
      return null
    }
  }

  async invalidateCache(key: string): Promise<void> {
    try {
      // Get cache entry
      const { data } = await supabase
        .from('ai_cache_entries')
        .select('url')
        .eq('cache_key', key)
        .single()

      if (data) {
        // Extract file path from URL
        const filePath = data.url.replace(`${this.cdnBaseUrl}${this.bucketName}/`, '')
        
        // Delete from storage
        await supabase.storage
          .from(this.bucketName)
          .remove([filePath])
      }

      // Remove from cache entries
      await supabase
        .from('ai_cache_entries')
        .delete()
        .eq('cache_key', key)
    } catch (error) {
      console.error('Failed to invalidate cache:', error)
    }
  }

  async cleanupExpiredEntries(): Promise<number> {
    try {
      // Get expired entries
      const { data: expiredEntries, error } = await supabase
        .from('ai_cache_entries')
        .select('cache_key, url')
        .lt('expires_at', new Date().toISOString())

      if (error || !expiredEntries) return 0

      // Delete files from storage
      const filePaths = expiredEntries.map(entry => 
        entry.url.replace(`${this.cdnBaseUrl}${this.bucketName}/`, '')
      )

      if (filePaths.length > 0) {
        await supabase.storage
          .from(this.bucketName)
          .remove(filePaths)
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('ai_cache_entries')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (deleteError) throw deleteError

      return expiredEntries.length
    } catch (error) {
      console.error('Failed to cleanup expired entries:', error)
      return 0
    }
  }

  async getCacheStats(): Promise<CacheStats> {
    try {
      // Get total entries and size
      const { data: totalData, error: totalError } = await supabase
        .from('ai_cache_entries')
        .select('size, hits')

      if (totalError) throw totalError

      const totalEntries = totalData?.length || 0
      const totalSize = totalData?.reduce((sum, entry) => sum + entry.size, 0) || 0

      // Calculate hit rate (simplified - would need request tracking for accurate rate)
      const totalHits = totalData?.reduce((sum, entry) => sum + entry.hits, 0) || 0
      const hitRate = totalEntries > 0 ? (totalHits / totalEntries) : 0

      // Get top assets by hits
      const { data: topAssets, error: topError } = await supabase
        .from('ai_cache_entries')
        .select('cache_key, hits, size')
        .order('hits', { ascending: false })
        .limit(10)

      if (topError) throw topError

      return {
        totalEntries,
        totalSize,
        hitRate,
        topAssets: topAssets?.map(asset => ({
          key: asset.cache_key,
          hits: asset.hits,
          size: asset.size
        })) || []
      }
    } catch (error) {
      console.error('Failed to get cache stats:', error)
      return {
        totalEntries: 0,
        totalSize: 0,
        hitRate: 0,
        topAssets: []
      }
    }
  }

  generateCacheKey(type: string, params: Record<string, any>): string {
    // Create deterministic cache key from parameters
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        result[key] = params[key]
        return result
      }, {} as Record<string, any>)

    const paramString = JSON.stringify(sortedParams)
    const hash = this.simpleHash(paramString)
    
    return `${type}_${hash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async preloadAssets(keys: string[]): Promise<void> {
    // Preload assets by making HEAD requests to warm the cache
    const promises = keys.map(async (key) => {
      const url = await this.getCachedAsset(key)
      if (url) {
        try {
          await fetch(url, { method: 'HEAD' })
        } catch (error) {
          console.warn(`Failed to preload asset ${key}:`, error)
        }
      }
    })

    await Promise.allSettled(promises)
  }

  async optimizeCache(): Promise<void> {
    try {
      // Remove least accessed entries if cache is getting too large
      const stats = await this.getCacheStats()
      const maxCacheSize = 1024 * 1024 * 1024 // 1GB limit
      
      if (stats.totalSize > maxCacheSize) {
        // Get least accessed entries
        const { data: leastAccessed, error } = await supabase
          .from('ai_cache_entries')
          .select('cache_key')
          .order('last_accessed', { ascending: true })
          .limit(Math.floor(stats.totalEntries * 0.1)) // Remove 10% of entries

        if (!error && leastAccessed) {
          for (const entry of leastAccessed) {
            await this.invalidateCache(entry.cache_key)
          }
        }
      }

      // Cleanup expired entries
      await this.cleanupExpiredEntries()
    } catch (error) {
      console.error('Failed to optimize cache:', error)
    }
  }
}

export const cdnCacheService = new CDNCacheService()