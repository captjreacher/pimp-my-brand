import { supabase } from '@/integrations/supabase/client';
import type { BrandRider, CV } from '../generators/types';

export interface ShareOptions {
  expiresAt?: Date;
  allowDownload?: boolean;
}

export interface ShareResult {
  id: string;
  token: string;
  url: string;
  expiresAt?: Date;
}

export interface SharedContent {
  id: string;
  kind: 'brand' | 'cv';
  content: BrandRider | CV;
  owner: {
    displayName?: string;
    handle?: string;
    avatarUrl?: string;
  };
  createdAt: Date;
  expiresAt?: Date;
}

export class ShareManager {
  private static readonly BASE_URL = window.location.origin;

  /**
   * Create a share link for a brand rider
   */
  static async shareBrandRider(
    brandId: string,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    return this.createShare('brand', brandId, options);
  }

  /**
   * Create a share link for a CV
   */
  static async shareCV(
    cvId: string,
    options: ShareOptions = {}
  ): Promise<ShareResult> {
    return this.createShare('cv', cvId, options);
  }

  /**
   * Get shared content by token
   */
  static async getSharedContent(token: string): Promise<SharedContent | null> {
    try {
      // Use the secure function to get share by token
      const { data: shareData, error: shareError } = await supabase
        .rpc('get_share_by_token', { _token: token });

      if (shareError || !shareData || shareData.length === 0) {
        return null;
      }

      const share = shareData[0];

      // Fetch the actual content based on the share kind
      let content: BrandRider | CV;
      let ownerQuery;

      if (share.kind === 'brand') {
        const { data: brandData, error: brandError } = await supabase
          .from('brands')
          .select(`
            *,
            profiles!inner(display_name, handle, avatar_url)
          `)
          .eq('id', share.target_id)
          .single();

        if (brandError || !brandData) {
          throw new Error('Brand not found');
        }

        content = this.mapBrandToBrandRider(brandData);
        ownerQuery = brandData.profiles;
      } else {
        const { data: cvData, error: cvError } = await supabase
          .from('cvs')
          .select(`
            *,
            profiles!inner(display_name, handle, avatar_url)
          `)
          .eq('id', share.target_id)
          .single();

        if (cvError || !cvData) {
          throw new Error('CV not found');
        }

        content = this.mapCVToCV(cvData);
        ownerQuery = cvData.profiles;
      }

      return {
        id: share.id,
        kind: share.kind as 'brand' | 'cv',
        content,
        owner: {
          displayName: ownerQuery.display_name,
          handle: ownerQuery.handle,
          avatarUrl: ownerQuery.avatar_url,
        },
        createdAt: new Date(share.created_at),
        expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
      };
    } catch (error) {
      console.error('Error fetching shared content:', error);
      return null;
    }
  }

  /**
   * List all shares for the current user
   */
  static async getUserShares(): Promise<Array<{
    id: string;
    kind: 'brand' | 'cv';
    targetId: string;
    token: string;
    url: string;
    createdAt: Date;
    expiresAt?: Date;
    title?: string;
  }>> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const { data: shares, error } = await supabase
        .from('shares')
        .select('*')
        .eq('user_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch titles separately for each share
      const sharesWithTitles = await Promise.all(
        shares.map(async (share) => {
          let title = 'Untitled';
          
          try {
            if (share.kind === 'brand') {
              const { data: brandData } = await supabase
                .from('brands')
                .select('title')
                .eq('id', share.target_id)
                .single();
              title = brandData?.title || 'Untitled Brand';
            } else if (share.kind === 'cv') {
              const { data: cvData } = await supabase
                .from('cvs')
                .select('title')
                .eq('id', share.target_id)
                .single();
              title = cvData?.title || 'Untitled CV';
            }
          } catch (err) {
            console.warn('Failed to fetch title for share:', share.id);
          }

          return {
            id: share.id,
            kind: share.kind as 'brand' | 'cv',
            targetId: share.target_id,
            token: share.token,
            url: this.generateShareURL(share.token),
            createdAt: new Date(share.created_at),
            expiresAt: share.expires_at ? new Date(share.expires_at) : undefined,
            title,
          };
        })
      );

      return sharesWithTitles;
    } catch (error) {
      console.error('Error fetching user shares:', error);
      throw error;
    }
  }

  /**
   * Delete a share
   */
  static async deleteShare(shareId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('shares')
        .delete()
        .eq('id', shareId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error deleting share:', error);
      throw error;
    }
  }

  /**
   * Update share expiration
   */
  static async updateShareExpiration(
    shareId: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('shares')
        .update({ expires_at: expiresAt?.toISOString() })
        .eq('id', shareId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error updating share expiration:', error);
      throw error;
    }
  }

  /**
   * Check if a share is valid (not expired)
   */
  static isShareValid(share: { expiresAt?: Date }): boolean {
    if (!share.expiresAt) {
      return true; // No expiration means it's always valid
    }
    return share.expiresAt > new Date();
  }

  /**
   * Generate a unique share token
   */
  private static generateToken(): string {
    // Generate a cryptographically secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Create a share record in the database
   */
  private static async createShare(
    kind: 'brand' | 'cv',
    targetId: string,
    options: ShareOptions
  ): Promise<ShareResult> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error('User not authenticated');
      }

      const token = this.generateToken();
      
      const { data, error } = await supabase
        .from('shares')
        .insert({
          user_id: user.user.id,
          kind,
          target_id: targetId,
          token,
          expires_at: options.expiresAt?.toISOString(),
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return {
        id: data.id,
        token: data.token,
        url: this.generateShareURL(data.token),
        expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      };
    } catch (error) {
      console.error('Error creating share:', error);
      throw error;
    }
  }

  /**
   * Generate a share URL from a token
   */
  private static generateShareURL(token: string): string {
    return `${this.BASE_URL}/share/${token}`;
  }

  /**
   * Map database brand to BrandRider type
   */
  private static mapBrandToBrandRider(brandData: any): BrandRider {
    return {
      title: brandData.title || 'Untitled Brand',
      tagline: brandData.tagline || '',
      voiceTone: brandData.tone_notes ? [brandData.tone_notes] : [],
      signaturePhrases: brandData.signature_phrases || [],
      strengths: brandData.strengths || [],
      weaknesses: brandData.weaknesses || [],
      palette: brandData.color_palette || [],
      fonts: brandData.fonts || { heading: 'Arial', body: 'Arial' },
      bio: brandData.bio || '',
      examples: brandData.examples || [],
      format: brandData.format_preset || 'professional',
    };
  }

  /**
   * Map database CV to CV type
   */
  private static mapCVToCV(cvData: any): CV {
    return {
      name: cvData.title || 'Untitled CV',
      role: 'Professional', // Default role, could be extracted from data
      summary: cvData.summary || '',
      experience: cvData.experience || [],
      skills: cvData.skills || [],
      links: cvData.links || [],
      format: cvData.format_preset || 'professional',
    };
  }

  /**
   * Create preset expiration options
   */
  static getExpirationPresets(): Array<{
    label: string;
    value: Date | null;
    description: string;
  }> {
    const now = new Date();
    
    return [
      {
        label: 'Never',
        value: null,
        description: 'Link never expires',
      },
      {
        label: '1 Hour',
        value: new Date(now.getTime() + 60 * 60 * 1000),
        description: 'Expires in 1 hour',
      },
      {
        label: '1 Day',
        value: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        description: 'Expires in 24 hours',
      },
      {
        label: '1 Week',
        value: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        description: 'Expires in 1 week',
      },
      {
        label: '1 Month',
        value: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        description: 'Expires in 1 month',
      },
      {
        label: '3 Months',
        value: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        description: 'Expires in 3 months',
      },
    ];
  }
}