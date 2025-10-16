import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useSendMessage, useAdminMessages, useMessageTemplates } from '@/hooks/use-admin-communication';
import { useToast } from '@/hooks/use-toast';
import { Mail, User, Clock, AlertTriangle, Info, MessageSquare } from 'lucide-react';
import type { SendMessageRequest } from '@/lib/admin/types/communication-types';

interface UserMessagingModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientUser: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

export function UserMessagingModal({ isOpen, onClose, recipientUser }: UserMessagingModalProps) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'direct' | 'support' | 'warning' | 'notification'>('direct');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');

  const { toast } = useToast();
  const sendMessage = useSendMessage();
  const { data: messageHistory } = useAdminMessages({ recipient_user_id: recipientUser.id }, 1, 10);
  const { data: templates } = useMessageTemplates();

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Subject and message are required.',
        variant: 'destructive',
      });
      return;
    }

    const request: SendMessageRequest = {
      recipient_user_id: recipientUser.id,
      subject: subject.trim(),
      message: message.trim(),
      message_type: messageType,
      priority,
    };

    try {
      await sendMessage.mutateAsync(request);
      toast({
        title: 'Message Sent',
        description: `Message sent successfully to ${recipientUser.full_name}`,
      });
      setSubject('');
      setMessage('');
      setSelectedTemplate('');
      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find(t => t.id === templateId);
    if (template) {
      setSubject(template.subject);
      setMessage(template.content);
      setMessageType(template.type as any);
      setSelectedTemplate(templateId);
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'support':
        return <MessageSquare className="h-4 w-4 text-blue-500" />;
      case 'notification':
        return <Info className="h-4 w-4 text-green-500" />;
      default:
        return <Mail className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Send Message to User
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Message Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Recipient Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Recipient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={recipientUser.avatar_url} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{recipientUser.full_name}</p>
                    <p className="text-sm text-muted-foreground">{recipientUser.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Template Selection */}
            {templates && templates.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="template">Message Template (Optional)</Label>
                <Select value={selectedTemplate} onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Message Type and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="messageType">Message Type</Label>
                <Select value={messageType} onValueChange={(value: any) => setMessageType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="direct">Direct Message</SelectItem>
                    <SelectItem value="support">Support</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter message subject..."
                maxLength={255}
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {message.length} characters
              </p>
            </div>
          </div>

          {/* Message History */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Messages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  {messageHistory?.messages && messageHistory.messages.length > 0 ? (
                    <div className="space-y-3 p-4">
                      {messageHistory.messages.map((msg) => (
                        <div key={msg.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getMessageTypeIcon(msg.message_type)}
                              <span className="text-sm font-medium">{msg.subject}</span>
                            </div>
                            <Badge className={getPriorityColor(msg.priority)}>
                              {msg.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {msg.message}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{new Date(msg.created_at).toLocaleDateString()}</span>
                            <Badge variant={msg.status === 'read' ? 'default' : 'secondary'}>
                              {msg.status}
                            </Badge>
                          </div>
                          <Separator />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No previous messages
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={sendMessage.isPending || !subject.trim() || !message.trim()}
          >
            {sendMessage.isPending ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}