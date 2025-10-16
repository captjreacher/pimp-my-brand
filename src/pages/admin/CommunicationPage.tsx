import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { UserMessagingModal } from '@/components/admin/communication/UserMessagingModal';
import { AnnouncementManager } from '@/components/admin/communication/AnnouncementManager';
import { SupportTicketInterface } from '@/components/admin/communication/SupportTicketInterface';
import { NotificationBroadcast } from '@/components/admin/communication/NotificationBroadcast';
import { useCommunicationStats, useSupportTicketStats } from '@/hooks/use-admin-communication';
import {
  MessageSquare,
  Megaphone,
  Ticket,
  Bell,
  Mail,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export default function CommunicationPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: commStats } = useCommunicationStats();
  const { data: ticketStats } = useSupportTicketStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Communication & Support</h1>
        <p className="text-muted-foreground">
          Manage user communications, announcements, and support tickets
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
          <TabsTrigger value="broadcast">Notifications</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="space-y-6">
            {/* Communication Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{commStats?.total_messages || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {commStats?.unread_messages || 0} unread
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Tickets</CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{commStats?.active_tickets || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {commStats?.resolved_tickets_today || 0} resolved today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Announcements</CardTitle>
                  <Megaphone className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{commStats?.pending_announcements || 0}</div>
                  <p className="text-xs text-muted-foreground">pending publication</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((commStats?.notification_delivery_rate || 0) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">notification delivery</p>
                </CardContent>
              </Card>
            </div>

            {/* Support Ticket Overview */}
            {ticketStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    Support Ticket Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">Open</span>
                      </div>
                      <p className="text-2xl font-bold">{ticketStats.open_tickets}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">In Progress</span>
                      </div>
                      <p className="text-2xl font-bold">{ticketStats.in_progress_tickets}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Resolved Today</span>
                      </div>
                      <p className="text-2xl font-bold">{ticketStats.resolved_today}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">Avg Resolution</span>
                      </div>
                      <p className="text-2xl font-bold">
                        {Math.round(ticketStats.avg_resolution_time)}h
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* By Category */}
                    <div>
                      <h4 className="font-medium mb-3">Tickets by Category</h4>
                      <div className="space-y-2">
                        {Object.entries(ticketStats.tickets_by_category).map(([category, count]) => (
                          <div key={category} className="flex items-center justify-between">
                            <span className="capitalize">{category}</span>
                            <Badge variant="secondary">{count}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* By Priority */}
                    <div>
                      <h4 className="font-medium mb-3">Tickets by Priority</h4>
                      <div className="space-y-2">
                        {Object.entries(ticketStats.tickets_by_priority).map(([priority, count]) => (
                          <div key={priority} className="flex items-center justify-between">
                            <span className="capitalize">{priority}</span>
                            <Badge 
                              variant={priority === 'urgent' ? 'destructive' : 'secondary'}
                            >
                              {count}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveTab('messages')}
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="h-8 w-8 text-blue-500" />
                      <div>
                        <h3 className="font-medium">Send Message</h3>
                        <p className="text-sm text-muted-foreground">
                          Send direct message to user
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveTab('announcements')}
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-8 w-8 text-green-500" />
                      <div>
                        <h3 className="font-medium">Create Announcement</h3>
                        <p className="text-sm text-muted-foreground">
                          Platform-wide announcement
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveTab('tickets')}
                  >
                    <div className="flex items-center gap-3">
                      <Ticket className="h-8 w-8 text-orange-500" />
                      <div>
                        <h3 className="font-medium">Manage Tickets</h3>
                        <p className="text-sm text-muted-foreground">
                          Handle support requests
                        </p>
                      </div>
                    </div>
                  </div>

                  <div
                    className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setActiveTab('broadcast')}
                  >
                    <div className="flex items-center gap-3">
                      <Bell className="h-8 w-8 text-purple-500" />
                      <div>
                        <h3 className="font-medium">Broadcast Notification</h3>
                        <p className="text-sm text-muted-foreground">
                          Send system notifications
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Direct Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Send Direct Messages</h3>
                <p className="text-muted-foreground mb-4">
                  Select a user from the user management page to send them a direct message.
                </p>
                <p className="text-sm text-muted-foreground">
                  You can also access messaging from individual user profiles in the User Management section.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Announcements Tab */}
        <TabsContent value="announcements">
          <AnnouncementManager />
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="tickets">
          <SupportTicketInterface />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="broadcast">
          <NotificationBroadcast />
        </TabsContent>
      </Tabs>

      {/* User Messaging Modal */}
      {selectedUser && (
        <UserMessagingModal
          isOpen={true}
          onClose={() => setSelectedUser(null)}
          recipientUser={selectedUser}
        />
      )}
    </div>
  );
}