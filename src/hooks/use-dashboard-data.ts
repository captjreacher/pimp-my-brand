import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Brand = Database['public']['Tables']['brands']['Row'];
type CV = Database['public']['Tables']['cvs']['Row'];
type Upload = Database['public']['Tables']['uploads']['Row'];

export interface DashboardStats {
  totalBrands: number;
  totalCVs: number;
  totalUploads: number;
  recentActivity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'brand' | 'cv' | 'upload';
  title: string;
  action: 'created' | 'updated';
  timestamp: string;
}

export function useDashboardData(userId: string | undefined) {
  const brandsQuery = useQuery({
    queryKey: ['dashboard-brands', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('brands')
        .select('id, title, tagline, format_preset, created_at, updated_at, logo_url, visibility')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const cvsQuery = useQuery({
    queryKey: ['dashboard-cvs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('cvs')
        .select('id, title, summary, format_preset, created_at, updated_at, visibility')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const uploadsQuery = useQuery({
    queryKey: ['dashboard-uploads', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('uploads')
        .select('id, original_name, mime_type, size_bytes, created_at, visibility')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const statsQuery = useQuery({
    queryKey: ['dashboard-stats', userId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!userId) {
        return {
          totalBrands: 0,
          totalCVs: 0,
          totalUploads: 0,
          recentActivity: [],
        };
      }

      const brands = brandsQuery.data || [];
      const cvs = cvsQuery.data || [];
      const uploads = uploadsQuery.data || [];

      // Create recent activity from all items
      const recentActivity: ActivityItem[] = [
        ...brands.map(brand => ({
          id: brand.id,
          type: 'brand' as const,
          title: brand.title || 'Untitled Brand',
          action: 'updated' as const,
          timestamp: brand.updated_at || brand.created_at || '',
        })),
        ...cvs.map(cv => ({
          id: cv.id,
          type: 'cv' as const,
          title: cv.title || 'Untitled CV',
          action: 'updated' as const,
          timestamp: cv.updated_at || cv.created_at || '',
        })),
        ...uploads.map(upload => ({
          id: upload.id,
          type: 'upload' as const,
          title: upload.original_name,
          action: 'created' as const,
          timestamp: upload.created_at || '',
        })),
      ]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10); // Show last 10 activities

      return {
        totalBrands: brands.length,
        totalCVs: cvs.length,
        totalUploads: uploads.length,
        recentActivity,
      };
    },
    enabled: !!userId && !brandsQuery.isLoading && !cvsQuery.isLoading && !uploadsQuery.isLoading,
  });

  return {
    brands: brandsQuery.data || [],
    cvs: cvsQuery.data || [],
    uploads: uploadsQuery.data || [],
    stats: statsQuery.data,
    isLoading: brandsQuery.isLoading || cvsQuery.isLoading || uploadsQuery.isLoading,
    error: brandsQuery.error || cvsQuery.error || uploadsQuery.error,
    refetch: () => {
      brandsQuery.refetch();
      cvsQuery.refetch();
      uploadsQuery.refetch();
      statsQuery.refetch();
    },
  };
}

export function useSearchableContent(userId: string | undefined, searchQuery: string = '') {
  return useQuery({
    queryKey: ['searchable-content', userId, searchQuery],
    queryFn: async () => {
      if (!userId) return { brands: [], cvs: [], uploads: [] };

      const query = searchQuery.toLowerCase();
      
      // Fetch all content
      const [brandsResult, cvsResult, uploadsResult] = await Promise.all([
        supabase
          .from('brands')
          .select('id, title, tagline, format_preset, created_at, updated_at, logo_url, visibility')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('cvs')
          .select('id, title, summary, format_preset, created_at, updated_at, visibility')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase
          .from('uploads')
          .select('id, original_name, mime_type, size_bytes, created_at, visibility')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
      ]);

      if (brandsResult.error) throw brandsResult.error;
      if (cvsResult.error) throw cvsResult.error;
      if (uploadsResult.error) throw uploadsResult.error;

      const brands = brandsResult.data || [];
      const cvs = cvsResult.data || [];
      const uploads = uploadsResult.data || [];

      // Filter by search query if provided
      if (query) {
        return {
          brands: brands.filter(brand => 
            (brand.title?.toLowerCase().includes(query)) ||
            (brand.tagline?.toLowerCase().includes(query)) ||
            (brand.format_preset?.toLowerCase().includes(query))
          ),
          cvs: cvs.filter(cv => 
            (cv.title?.toLowerCase().includes(query)) ||
            (cv.summary?.toLowerCase().includes(query)) ||
            (cv.format_preset?.toLowerCase().includes(query))
          ),
          uploads: uploads.filter(upload => 
            upload.original_name.toLowerCase().includes(query) ||
            (upload.mime_type?.toLowerCase().includes(query))
          ),
        };
      }

      return { brands, cvs, uploads };
    },
    enabled: !!userId,
  });
}