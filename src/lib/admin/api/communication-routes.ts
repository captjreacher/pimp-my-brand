import { supabase } from '@/integrations/supabase/client';
import { AdminMessagingService } from '../messaging-service';
import { NotificationBroadcastService } from '../notification-broadcast-service';
import type {
  SendMessageRequest,
  CreateAnnouncementRequest,
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
  AddTicketMessageRequest,
  SendNotificationRequest,
  MessageFilters,
  AnnouncementFilters,
  SupportTicketFilters,
  NotificationFilters
} from '../types/communication-types';

export class CommunicationAPI {
  // Admin Messages
  static async sendMessage(request: SendMessageRequest) {
    return AdminMessagingService.sendMessage(request);
  }

  static async getMessages(filters: MessageFilters = {}, page = 1, limit = 20) {
    return AdminMessagingService.getMessages(filters, page, limit);
  }

  static async markMessageAsRead(messageId: string) {
    return AdminMessagingService.markMessageAsRead(messageId);
  }

  // Platform Announcements
  static async createAnnouncement(request: CreateAnnouncementRequest) {
    return AdminMessagingService.createAnnouncement(request);
  }

  static async publishAnnouncement(announcementId: string) {
    return AdminMessagingService.publishAnnouncement(announcementId);
  }

  static async getAnnouncements(filters: AnnouncementFilters = {}, page = 1, limit = 20) {
    return AdminMessagingService.getAnnouncements(filters, page, limit);
  }

  static async updateAnnouncement(announcementId: string, updates: Partial<CreateAnnouncementRequest>) {
    const { error } = await supabase
      .from('platform_announcements')
      .update(updates)
      .eq('id', announcementId);

    if (error) throw error;
  }

  static async deleteAnnouncement(announcementId: string) {
    const { error } = await supabase
      .from('platform_announcements')
      .delete()
      .eq('id', announcementId);

    if (error) throw error;
  }

  // Support Tickets
  static async createSupportTicket(request: CreateSupportTicketRequest) {
    return AdminMessagingService.createSupportTicket(request);
  }

  static async updateSupportTicket(ticketId: string, request: UpdateSupportTicketRequest) {
    return AdminMessagingService.updateSupportTicket(ticketId, request);
  }

  static async getSupportTickets(filters: SupportTicketFilters = {}, page = 1, limit = 20) {
    return AdminMessagingService.getSupportTickets(filters, page, limit);
  }

  static async getSupportTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name),
        assigned_admin:profiles!support_tickets_assigned_admin_id_fkey(id, email, full_name)
      `)
      .eq('id', ticketId)
      .single();

    if (error) throw error;
    return data;
  }

  static async assignTicket(ticketId: string, adminId: string) {
    return AdminMessagingService.updateSupportTicket(ticketId, {
      assigned_admin_id: adminId,
      status: 'in_progress'
    });
  }

  static async closeTicket(ticketId: string, resolution?: string) {
    return AdminMessagingService.updateSupportTicket(ticketId, {
      status: 'closed',
      resolution
    });
  }

  // Support Ticket Messages
  static async addTicketMessage(ticketId: string, request: AddTicketMessageRequest) {
    return AdminMessagingService.addTicketMessage(ticketId, request);
  }

  static async getTicketMessages(ticketId: string) {
    return AdminMessagingService.getTicketMessages(ticketId);
  }

  // User Notifications
  static async sendNotification(request: SendNotificationRequest) {
    if (request.user_id) {
      return AdminMessagingService.createUserNotification(request);
    } else if (request.user_ids) {
      return NotificationBroadcastService.broadcastToUsers(request.user_ids, request);
    } else {
      throw new Error('Either user_id or user_ids must be provided');
    }
  }

  static async broadcastNotification(
    request: Omit<SendNotificationRequest, 'user_id'> & {
      target_audience?: 'all' | 'subscribers' | 'free_users';
    }
  ) {
    switch (request.target_audience) {
      case 'subscribers':
        return NotificationBroadcastService.broadcastToSubscribers(request);
      case 'free_users':
        return NotificationBroadcastService.broadcastToFreeUsers(request);
      case 'all':
      default:
        return NotificationBroadcastService.broadcastToAll(request);
    }
  }

  static async getUserNotifications(userId: string, includeRead = false, limit = 50) {
    return NotificationBroadcastService.getUserNotifications(userId, includeRead, limit);
  }

  static async markNotificationAsRead(notificationId: string) {
    return NotificationBroadcastService.markNotificationAsRead(notificationId);
  }

  static async dismissNotification(notificationId: string) {
    return NotificationBroadcastService.dismissNotification(notificationId);
  }

  // System Notifications
  static async broadcastMaintenanceNotification(
    scheduledTime: string,
    duration: string,
    description?: string
  ) {
    return NotificationBroadcastService.broadcastMaintenanceNotification(
      scheduledTime,
      duration,
      description
    );
  }

  static async broadcastSecurityAlert(
    title: string,
    message: string,
    actionRequired?: { url: string; label: string }
  ) {
    return NotificationBroadcastService.broadcastSecurityAlert(title, message, actionRequired);
  }

  static async broadcastFeatureAnnouncement(
    title: string,
    description: string,
    featureUrl?: string
  ) {
    return NotificationBroadcastService.broadcastFeatureAnnouncement(title, description, featureUrl);
  }

  static async broadcastBillingNotification(
    title: string,
    message: string,
    targetSubscribers = true
  ) {
    return NotificationBroadcastService.broadcastBillingNotification(title, message, targetSubscribers);
  }

  // Statistics
  static async getCommunicationStats() {
    return AdminMessagingService.getCommunicationStats();
  }

  static async getSupportTicketStats() {
    return AdminMessagingService.getSupportTicketStats();
  }

  static async getDeliveryStats(dateFrom?: string, dateTo?: string) {
    return NotificationBroadcastService.getDeliveryStats(dateFrom, dateTo);
  }

  // Bulk Operations
  static async bulkUpdateTickets(ticketIds: string[], updates: UpdateSupportTicketRequest) {
    const promises = ticketIds.map(id => AdminMessagingService.updateSupportTicket(id, updates));
    await Promise.all(promises);
  }

  static async bulkAssignTickets(ticketIds: string[], adminId: string) {
    await this.bulkUpdateTickets(ticketIds, {
      assigned_admin_id: adminId,
      status: 'in_progress'
    });
  }

  static async bulkCloseTickets(ticketIds: string[], resolution?: string) {
    await this.bulkUpdateTickets(ticketIds, {
      status: 'closed',
      resolution
    });
  }

  // Search and Filters
  static async searchMessages(query: string, filters: MessageFilters = {}) {
    return AdminMessagingService.getMessages({
      ...filters,
      search: query
    });
  }

  static async searchTickets(query: string, filters: SupportTicketFilters = {}) {
    return AdminMessagingService.getSupportTickets({
      ...filters,
      search: query
    });
  }

  static async searchAnnouncements(query: string, filters: AnnouncementFilters = {}) {
    return AdminMessagingService.getAnnouncements({
      ...filters,
      search: query
    });
  }

  // Admin Users for Assignment
  static async getAdminUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, app_role')
      .in('app_role', ['admin', 'super_admin', 'moderator'])
      .order('full_name');

    if (error) throw error;
    return data || [];
  }

  // Template Messages
  static async getMessageTemplates() {
    // In a real implementation, this would come from a database table
    return [
      {
        id: 'welcome',
        name: 'Welcome Message',
        subject: 'Welcome to Personal Brand Generator',
        content: 'Welcome to our platform! We\'re excited to help you create your personal brand.',
        type: 'notification'
      },
      {
        id: 'suspension_warning',
        name: 'Account Suspension Warning',
        subject: 'Account Activity Warning',
        content: 'We\'ve noticed some activity on your account that may violate our terms of service.',
        type: 'warning'
      },
      {
        id: 'billing_issue',
        name: 'Billing Issue Resolution',
        subject: 'Billing Issue Resolved',
        content: 'Your billing issue has been resolved. Thank you for your patience.',
        type: 'support'
      }
    ];
  }
}