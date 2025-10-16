import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  useSupportTickets,
  useSupportTicket,
  useTicketMessages,
  useUpdateSupportTicket,
  useAddTicketMessage,
  useAdminUsers,
  useBulkUpdateTickets,
} from '@/hooks/use-admin-communication';
import { useToast } from '@/hooks/use-toast';
import {
  Ticket,
  MessageSquare,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  UserCheck,
  Send,
  Paperclip,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import type {
  SupportTicket,
  SupportTicketMessage,
  UpdateSupportTicketRequest,
  AddTicketMessageRequest,
  SupportTicketFilters,
} from '@/lib/admin/types/communication-types';

export function SupportTicketInterface() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [filters, setFilters] = useState<SupportTicketFilters>({});
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const { data: ticketsData, isLoading } = useSupportTickets(filters, page, 20);
  const { data: adminUsers } = useAdminUsers();
  const bulkUpdate = useBulkUpdateTickets();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'waiting_user':
        return <User className="h-4 w-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'waiting_user':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-orange-100 text-orange-800';
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

  const handleBulkAssign = async (adminId: string) => {
    if (selectedTickets.length === 0) return;

    try {
      await bulkUpdate.mutateAsync({
        ticketIds: selectedTickets,
        updates: { assigned_admin_id: adminId, status: 'in_progress' }
      });
      setSelectedTickets([]);
    } catch (error) {
      console.error('Failed to bulk assign tickets:', error);
    }
  };

  const handleBulkStatusUpdate = async (status: string) => {
    if (selectedTickets.length === 0) return;

    try {
      await bulkUpdate.mutateAsync({
        ticketIds: selectedTickets,
        updates: { status: status as any }
      });
      setSelectedTickets([]);
    } catch (error) {
      console.error('Failed to bulk update tickets:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="h-6 w-6" />
            Support Tickets
          </h2>
          <p className="text-muted-foreground">
            Manage and respond to user support requests
          </p>
        </div>
      </div>

      {/* Filters and Bulk Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={filters.status || ''}
                  onValueChange={(value) =>
                    setFilters({ ...filters, status: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_user">Waiting User</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={filters.category || ''}
                  onValueChange={(value) =>
                    setFilters({ ...filters, category: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="content">Content</SelectItem>
                    <SelectItem value="account">Account</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={filters.priority || ''}
                  onValueChange={(value) =>
                    setFilters({ ...filters, priority: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All priorities</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Assigned To</Label>
                <Select
                  value={filters.assigned_admin_id || ''}
                  onValueChange={(value) =>
                    setFilters({ ...filters, assigned_admin_id: value || undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All admins" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All admins</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {adminUsers?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search</Label>
                <Input
                  placeholder="Search tickets..."
                  value={filters.search || ''}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value || undefined })
                  }
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedTickets.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                <span className="text-sm font-medium">
                  {selectedTickets.length} ticket(s) selected
                </span>
                <Separator orientation="vertical" className="h-4" />
                <Select onValueChange={handleBulkAssign}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adminUsers?.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id}>
                        {admin.full_name || admin.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select onValueChange={handleBulkStatusUpdate}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Change status..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="waiting_user">Waiting User</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedTickets([])}
                >
                  Clear Selection
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading tickets...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        ticketsData?.tickets.length > 0 &&
                        selectedTickets.length === ticketsData.tickets.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTickets(ticketsData?.tickets.map(t => t.id) || []);
                        } else {
                          setSelectedTickets([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Ticket</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ticketsData?.tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedTickets.includes(ticket.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTickets([...selectedTickets, ticket.id]);
                          } else {
                            setSelectedTickets(selectedTickets.filter(id => id !== ticket.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {ticket.description}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {ticket.user?.full_name || 'Unknown'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {ticket.user?.email || ticket.user_email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{ticket.category}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(ticket.status)}
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {ticket.assigned_admin ? (
                        <div className="flex items-center gap-2">
                          <UserCheck className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {ticket.assigned_admin.full_name || ticket.assigned_admin.email}
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(ticket.created_at).toLocaleDateString()}</p>
                        <p className="text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTicket(ticket.id)}
                      >
                        <MessageSquare className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <TicketDetailModal
          ticketId={selectedTicket}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
}

// Ticket Detail Modal Component
function TicketDetailModal({
  ticketId,
  onClose,
}: {
  ticketId: string;
  onClose: () => void;
}) {
  const [newMessage, setNewMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);

  const { toast } = useToast();
  const { data: ticket } = useSupportTicket(ticketId);
  const { data: messages } = useTicketMessages(ticketId);
  const { data: adminUsers } = useAdminUsers();
  const updateTicket = useUpdateSupportTicket();
  const addMessage = useAddTicketMessage();

  const handleStatusUpdate = async (status: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        request: { status: status as any }
      });
      toast({
        title: 'Status Updated',
        description: `Ticket status changed to ${status.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update ticket status',
        variant: 'destructive',
      });
    }
  };

  const handleAssign = async (adminId: string) => {
    try {
      await updateTicket.mutateAsync({
        ticketId,
        request: { assigned_admin_id: adminId, status: 'in_progress' }
      });
      toast({
        title: 'Ticket Assigned',
        description: 'Ticket has been assigned successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign ticket',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await addMessage.mutateAsync({
        ticketId,
        request: {
          message: newMessage.trim(),
          is_internal: isInternal
        }
      });
      setNewMessage('');
      toast({
        title: 'Message Sent',
        description: 'Your message has been added to the ticket',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {ticket.subject}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4">
          {/* Ticket Details */}
          <div className="lg:col-span-2 space-y-4">
            {/* Messages */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4 p-4">
                    {/* Original ticket */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>
                            <User className="h-3 w-3" />
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">
                          {ticket.user?.full_name || 'User'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(ticket.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="ml-8 p-3 bg-muted rounded-md">
                        <p className="whitespace-pre-wrap">{ticket.description}</p>
                      </div>
                    </div>

                    <Separator />

                    {/* Messages */}
                    {messages?.map((message) => (
                      <div key={message.id} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>
                              <User className="h-3 w-3" />
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">
                            {message.sender?.full_name || message.sender?.email}
                          </span>
                          {message.sender?.app_role && (
                            <Badge variant="secondary" className="text-xs">
                              {message.sender.app_role}
                            </Badge>
                          )}
                          {message.is_internal && (
                            <Badge variant="outline" className="text-xs">
                              Internal
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {new Date(message.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="ml-8 p-3 bg-muted rounded-md">
                          <p className="whitespace-pre-wrap">{message.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Reply Form */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Reply</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reply">Message</Label>
                  <Textarea
                    id="reply"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    rows={4}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="internal"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                    />
                    <Label htmlFor="internal" className="text-sm">
                      Internal note (not visible to user)
                    </Label>
                  </div>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || addMessage.isPending}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {addMessage.isPending ? 'Sending...' : 'Send Reply'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ticket Info */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ticket Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select
                    value={ticket.status}
                    onValueChange={handleStatusUpdate}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="waiting_user">Waiting User</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Assign To</Label>
                  <Select
                    value={ticket.assigned_admin_id || ''}
                    onValueChange={handleAssign}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select admin..." />
                    </SelectTrigger>
                    <SelectContent>
                      {adminUsers?.map((admin) => (
                        <SelectItem key={admin.id} value={admin.id}>
                          {admin.full_name || admin.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-2 text-sm">
                  <div>
                    <Label>Category</Label>
                    <p className="capitalize">{ticket.category}</p>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                  <div>
                    <Label>Created</Label>
                    <p>{new Date(ticket.created_at).toLocaleString()}</p>
                  </div>
                  {ticket.resolved_at && (
                    <div>
                      <Label>Resolved</Label>
                      <p>{new Date(ticket.resolved_at).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getPriorityColor(priority: string) {
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
}

function getStatusColor(status: string) {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800';
    case 'closed':
      return 'bg-gray-100 text-gray-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'waiting_user':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-orange-100 text-orange-800';
  }
}