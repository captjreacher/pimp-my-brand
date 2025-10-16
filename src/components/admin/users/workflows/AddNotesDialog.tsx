import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Clock } from 'lucide-react';
import { type AdminUserView } from '@/lib/admin/user-management-service';

interface AddNotesDialogProps {
  user: AdminUserView | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isLoading?: boolean;
}

export const AddNotesDialog: React.FC<AddNotesDialogProps> = ({
  user,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  const [notes, setNotes] = useState('');

  const handleConfirm = () => {
    if (notes.trim()) {
      onConfirm(notes.trim());
      handleClose();
    }
  };

  const handleClose = () => {
    setNotes('');
    onClose();
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const parseAdminNotes = (adminNotes?: string) => {
    if (!adminNotes) return [];
    
    // Split by timestamp pattern and parse entries
    const entries = adminNotes.split(/\n\n(?=\[)/);
    return entries.map(entry => {
      const timestampMatch = entry.match(/^\[([^\]]+)\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : null;
      const content = entry.replace(/^\[[^\]]+\]\s*/, '');
      
      return {
        timestamp,
        content: content.trim()
      };
    }).filter(entry => entry.content);
  };

  if (!user) return null;

  const existingNotes = parseAdminNotes(user.admin_notes);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Add Admin Notes</span>
          </DialogTitle>
          <DialogDescription>
            Add administrative notes to this user's profile for future reference.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback>
                {getInitials(user.full_name, user.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-medium">{user.full_name || 'Unnamed User'}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {user.app_role.replace('_', ' ')}
                </Badge>
                {user.is_suspended && (
                  <Badge variant="destructive" className="text-xs">
                    Suspended
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Existing Notes */}
          {existingNotes.length > 0 && (
            <div className="space-y-2">
              <Label>Existing Admin Notes</Label>
              <ScrollArea className="h-32 w-full border rounded-md p-3">
                <div className="space-y-3">
                  {existingNotes.map((note, index) => (
                    <div key={index} className="text-sm">
                      {note.timestamp && (
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground mb-1">
                          <Clock className="h-3 w-3" />
                          <span>{note.timestamp}</span>
                        </div>
                      )}
                      <div className="pl-4 border-l-2 border-muted">
                        <pre className="whitespace-pre-wrap font-sans">{note.content}</pre>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* New Notes Input */}
          <div className="space-y-2">
            <Label htmlFor="notes">New Admin Notes *</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter your administrative notes about this user..."
              rows={6}
              className="resize-none"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Notes will be timestamped and attributed to your admin account</span>
              <span>{notes.length}/1000</span>
            </div>
          </div>

          {/* Notes Guidelines */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm">
              <p className="font-medium text-blue-800 mb-2">Notes Guidelines:</p>
              <ul className="text-blue-700 space-y-1">
                <li>• Be specific and factual in your observations</li>
                <li>• Include relevant dates, actions, or communications</li>
                <li>• Avoid personal opinions or subjective judgments</li>
                <li>• These notes are for administrative reference only</li>
              </ul>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !notes.trim() || notes.length > 1000}
          >
            {isLoading ? 'Adding Notes...' : 'Add Notes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};