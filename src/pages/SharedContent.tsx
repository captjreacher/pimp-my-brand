import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, AlertCircle, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SharedBrandView } from '@/components/share/SharedBrandView';
import { SharedCVView } from '@/components/share/SharedCVView';
import { ShareManager, type SharedContent } from '@/lib/export/share-manager';
import { PDFExporter } from '@/lib/export/pdf-exporter';
import { PNGExporter } from '@/lib/export/png-exporter';
import { toast } from 'sonner';

export function SharedContent() {
  const { token } = useParams<{ token: string }>();
  const [sharedContent, setSharedContent] = useState<SharedContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    loadSharedContent();
  }, [token]);

  const loadSharedContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const content = await ShareManager.getSharedContent(token!);
      
      if (!content) {
        setError('Content not found or link has expired');
        return;
      }

      if (!ShareManager.isShareValid(content)) {
        setError('This share link has expired');
        return;
      }

      setSharedContent(content);
    } catch (err) {
      console.error('Error loading shared content:', err);
      setError('Failed to load shared content');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!sharedContent) return;

    try {
      setExporting(true);
      
      let result;
      if (sharedContent.kind === 'brand') {
        result = await PDFExporter.exportBrandRider(sharedContent.content as any);
      } else {
        result = await PDFExporter.exportCV(sharedContent.content as any);
      }

      // Create download link
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(result.url);
      
      toast.success('PDF exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export PDF');
    } finally {
      setExporting(false);
    }
  };

  const handleExportPNG = async () => {
    if (!sharedContent) return;

    try {
      setExporting(true);
      
      let result;
      if (sharedContent.kind === 'brand') {
        result = await PNGExporter.exportBrandRiderHero(sharedContent.content as any);
      } else {
        result = await PNGExporter.exportCVHero(sharedContent.content as any);
      }

      // Create download link
      const link = document.createElement('a');
      link.href = result.url;
      link.download = result.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up blob URL
      URL.revokeObjectURL(result.url);
      
      toast.success('Image exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      toast.error('Failed to export image');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading shared content...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <h1 className="text-xl font-semibold">Content Not Available</h1>
              <p className="text-muted-foreground">{error}</p>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Go to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sharedContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Action Bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              <span className="font-medium">
                Shared {sharedContent.kind === 'brand' ? 'Brand Rider' : 'CV'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyLink}
              >
                Copy Link
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPNG}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Export PNG'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exporting}
              >
                {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Export PDF'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {sharedContent.kind === 'brand' ? (
        <SharedBrandView sharedContent={sharedContent as any} />
      ) : (
        <SharedCVView sharedContent={sharedContent as any} />
      )}
    </div>
  );
}