import { useState, useEffect } from 'react';
import { Copy, ExternalLink, Trash2, Clock, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShareManager, type ShareResult } from '@/lib/export/share-manager';
import { toast } from 'sonner';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: 'brand' | 'cv';
  contentId: string;
  contentTitle: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  contentType,
  contentId,
  contentTitle,
}: ShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [shares, setShares] = useState<Array<{
    id: string;
    token: string;
    url: string;
    createdAt: Date;
    expiresAt?: Date;
  }>>([]);
  const [selectedExpiration, setSelectedExpiration] = useState<string>('never');

  const expirationOptions = ShareManager.getExpirationPresets();

  useEffect(() => {
    if (open) {
      loadExistingShares();
    }
  }, [open, contentId]);

  const loadExistingShares = async () => {
    try {
      const userShares = await ShareManager.getUserShares();
      const contentShares = userShares.filter(share => 
        share.targetId === contentId && share.kind === contentType
      );
      setShares(contentShares);
    } catch (err) {
      console.error('Error loading shares:', err);
    }
  };

  const handleCreateShare = async () => {
    try {
      setLoading(true);
      
      const expirationPreset = expirationOptions.find(
        option => option.label.toLowerCase().replace(' ', '') === selectedExpiration
      );
      
      let result: ShareResult;
      if (contentType === 'brand') {
        result = await ShareManager.shareBrandRider(contentId, {
          expiresAt: expirationPreset?.value || undefined,
        });
      } else {
        result = await ShareManager.shareCV(contentId, {
          expiresAt: expirationPreset?.value || undefined,
        });
      }

      setShares(prev => [...prev, {
        id: result.id,
        token: result.token,
        url: result.url,
        createdAt: new Date(),
        expiresAt: result.expiresAt,
      }]);

      toast.success('Share link created successfully');
    } catch (err) {
      console.error('Error creating share:', err);
      toast.error('Failed to create share link');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  const handleDeleteShare = async (shareId: string) => {
    try {
      await ShareManager.deleteShare(shareId);
      setShares(prev => prev.filter(share => share.id !== shareId));
      toast.success('Share link deleted');
    } catch (err) {
      console.error('Error deleting share:', err);
      toast.error('Failed to delete share link');
    }
  };

  const isShareExpired = (expiresAt?: Date) => {
    return expiresAt && expiresAt < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Share {contentTitle}</DialogTitle>
          <DialogDescription>
            Create a shareable link for your {contentType === 'brand' ? 'brand rider' : 'CV'}.
            Anyone with the link will be able to view it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Share */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Create New Share Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="expiration">Link Expiration</Label>
                <Select value={selectedExpiration} onValueChange={setSelectedExpiration}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {expirationOptions.map((option) => (
                      <SelectItem 
                        key={option.label} 
                        value={option.label.toLowerCase().replace(' ', '')}
                      >
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {option.description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={handleCreateShare} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <ExternalLink className="h-4 w-4 mr-2" />
                )}
                Create Share Link
              </Button>
            </CardContent>
          </Card>

          {/* Existing Shares */}
          {shares.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Existing Share Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-3 p-3 border rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            Created {share.createdAt.toLocaleDateString()}
                          </span>
                          {share.expiresAt && (
                            <Badge 
                              variant={isShareExpired(share.expiresAt) ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              <Clock className="h-3 w-3 mr-1" />
                              {isShareExpired(share.expiresAt) 
                                ? 'Expired' 
                                : `Expires ${share.expiresAt.toLocaleDateString()}`
                              }
                            </Badge>
                          )}
                          {!share.expiresAt && (
                            <Badge variant="outline" className="text-xs">
                              Never expires
                            </Badge>
                          )}
                        </div>
                        <Input
                          value={share.url}
                          readOnly
                          className="text-xs font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(share.url)}
                          disabled={isShareExpired(share.expiresAt)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(share.url, '_blank')}
                          disabled={isShareExpired(share.expiresAt)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}