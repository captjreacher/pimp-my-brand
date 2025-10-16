import { useState } from 'react';
import { Download, FileText, Image, Share2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PDFExporter } from '@/lib/export/pdf-exporter';
import { PNGExporter } from '@/lib/export/png-exporter';
import { ShareManager } from '@/lib/export/share-manager';
import { ShareDialog } from '@/components/export/ShareDialog';
import { toast } from 'sonner';
import type { BrandRider, CV } from '@/lib/generators/types';

interface ExportButtonProps {
  content: BrandRider | CV;
  contentType: 'brand' | 'cv';
  contentId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
}

export function ExportButton({ 
  content, 
  contentType, 
  contentId,
  variant = 'default',
  size = 'default'
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      
      let result;
      if (contentType === 'brand') {
        result = await PDFExporter.exportBrandRider(content as BrandRider);
      } else {
        result = await PDFExporter.exportCV(content as CV);
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
    try {
      setExporting(true);
      
      let result;
      if (contentType === 'brand') {
        result = await PNGExporter.exportBrandRiderHero(content as BrandRider);
      } else {
        result = await PNGExporter.exportCVHero(content as CV);
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

  const handleShare = () => {
    setShareDialogOpen(true);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            <span className="ml-2">Export</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleExportPDF} disabled={exporting}>
            <FileText className="h-4 w-4 mr-2" />
            Export as PDF
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPNG} disabled={exporting}>
            <Image className="h-4 w-4 mr-2" />
            Export as PNG
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Link
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        contentType={contentType}
        contentId={contentId}
        contentTitle={contentType === 'brand' ? (content as BrandRider).title : (content as CV).name}
      />
    </>
  );
}