import { supabase } from '@/integrations/supabase/client';
import { auditService } from './audit-service';
import type {
  AdminMessage,
  PlatformAnnouncement,
  SupportTicket,
  SupportTicketMessage,
  UserNotification,
  SendMessageRequest,
  CreateAnnouncementRequest,
  CreateSupportTicketRequest,
  UpdateSupportTicketRequest,
  AddTicketMessageRequest,
  SendNotificationRequest,
  MessageFilters,
  AnnouncementFilters,
  SupportTicketFilters,
  NotificationFilters,
  CommunicationStats,
  SupportTicketStats,
  NotificationStats
} from './types/communication-types';

export class AdminMessagingService {
  // Admin Messages
  static async sendMessage(request: SendMessageRequest): Promise<AdminMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('admin_messages')
      .insert({
        admin_user_id: user.id,
        ...request
      })
      .select(`
        *,
        admin_user:profiles!admin_messages_admin_user_id_fkey(id, email, full_name),
        recipient_user:profiles!admin_messages_recipient_user_id_fkey(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    // Log the action
    await auditLog('message_sent', 'admin_message', data.id, {
      recipient_user_id: request.recipient_user_id,
      subject: request.subject,
      message_type: request.message_type
    });

    // Create notification for recipient
    await this.createUserNotification({
      user_id: request.recipient_user_id,
      title: `New message: ${request.subject}`,
      message: request.message.substring(0, 200) + (request.message.length > 200 ? '...' : ''),
      notification_type: 'info',
      priority: request.priority || 'normal',
      action_url: '/messages',
      action_label: 'View Message'
    });

    return data;
  }

  static async getMessages(filters: MessageFilters = {}, page = 1, limit = 20): Promise<{
    messages: AdminMessage[];
    total: number;
  }> {
    let query = supabase
      .from('admin_messages')
      .select(`
        *,
        admin_user:profiles!admin_messages_admin_user_id_fkey(id, email, full_name),
        recipient_user:profiles!admin_messages_recipient_user_id_fkey(id, email, full_name)
      `, { count: 'exact' });

    // Apply filters
    if (filters.recipient_user_id) {
      query = query.eq('recipient_user_id', filters.recipient_user_id);
    }
    if (filters.message_type) {
      query = query.eq('message_type', filters.message_type);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,message.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      messages: data || [],
      total: count || 0
    };
  }

  static async markMessageAsRead(messageId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_messages')
      .update({
        status: 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', messageId);

    if (error) throw error;
  }

  // Platform Announcements
  static async createAnnouncement(request: CreateAnnouncementRequest): Promise<PlatformAnnouncement> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('platform_announcements')
      .insert({
        admin_user_id: user.id,
        ...request
      })
      .select(`
        *,
        admin_user:profiles!platform_announcements_admin_user_id_fkey(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    await auditLog('announcement_created', 'platform_announcement', data.id, {
      title: request.title,
      announcement_type: request.announcement_type,
      target_audience: request.target_audience
    });

    return data;
  }

  static async publishAnnouncement(announcementId: string): Promise<void> {
    const { data: announcement, error: fetchError } = await supabase
      .from('platform_announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from('platform_announcements')
      .update({
        status: 'published',
        published_at: new Date().toISOString()
      })
      .eq('id', announcementId);

    if (error) throw error;

    await auditLog('announcement_published', 'platform_announcement', announcementId, {
      title: announcement.title,
      target_audience: announcement.target_audience
    });

    // Create notifications for target audience
    await this.broadcastAnnouncementNotification(announcement);
  }

  static async getAnnouncements(filters: AnnouncementFilters = {}, page = 1, limit = 20): Promise<{
    announcements: PlatformAnnouncement[];
    total: number;
  }> {
    let query = supabase
      .from('platform_announcements')
      .select(`
        *,
        admin_user:profiles!platform_announcements_admin_user_id_fkey(id, email, full_name)
      `, { count: 'exact' });

    // Apply filters
    if (filters.announcement_type) {
      query = query.eq('announcement_type', filters.announcement_type);
    }
    if (filters.target_audience) {
      query = query.eq('target_audience', filters.target_audience);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      announcements: data || [],
      total: count || 0
    };
  }

  // Support Tickets
  static async createSupportTicket(request: CreateSupportTicketRequest): Promise<SupportTicket> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('support_tickets')
      .insert({
        user_id: user.id,
        ...request
      })
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    await auditLog('support_ticket_created', 'support_ticket', data.id, {
      subject: request.subject,
      category: request.category,
      priority: request.priority
    });

    return data;
  }

  static async updateSupportTicket(ticketId: string, request: UpdateSupportTicketRequest): Promise<void> {
    const { error } = await supabase
      .from('support_tickets')
      .update({
        ...request,
        ...(request.status === 'resolved' && { resolved_at: new Date().toISOString() }),
        ...(request.status === 'closed' && { closed_at: new Date().toISOString() })
      })
      .eq('id', ticketId);

    if (error) throw error;

    await auditLog('support_ticket_updated', 'support_ticket', ticketId, request);
  }

  static async getSupportTickets(filters: SupportTicketFilters = {}, page = 1, limit = 20): Promise<{
    tickets: SupportTicket[];
    total: number;
  }> {
    let query = supabase
      .from('support_tickets')
      .select(`
        *,
        user:profiles!support_tickets_user_id_fkey(id, email, full_name),
        assigned_admin:profiles!support_tickets_assigned_admin_id_fkey(id, email, full_name)
      `, { count: 'exact' });

    // Apply filters
    if (filters.assigned_admin_id) {
      query = query.eq('assigned_admin_id', filters.assigned_admin_id);
    }
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters.search) {
      query = query.or(`subject.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return {
      tickets: data || [],
      total: count || 0
    };
  }

  static async addTicketMessage(ticketId: string, request: AddTicketMessageRequest): Promise<SupportTicketMessage> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('support_ticket_messages')
      .insert({
        ticket_id: ticketId,
        sender_id: user.id,
        ...request
      })
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_id_fkey(id, email, full_name, app_role)
      `)
      .single();

    if (error) throw error;

    await auditLog('support_ticket_message_added', 'support_ticket_message', data.id, {
      ticket_id: ticketId,
      is_internal: request.is_internal
    });

    return data;
  }

  static async getTicketMessages(ticketId: string): Promise<SupportTicketMessage[]> {
    const { data, error } = await supabase
      .from('support_ticket_messages')
      .select(`
        *,
        sender:profiles!support_ticket_messages_sender_id_fkey(id, email, full_name, app_role)
      `)
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return data || [];
  }

  // User Notifications
  static async createUserNotification(request: SendNotificationRequest): Promise<UserNotification> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_notifications')
      .insert({
        admin_user_id: user.id,
        ...request
      })
      .select(`
        *,
        admin_user:profiles!user_notifications_admin_user_id_fkey(id, email, full_name)
      `)
      .single();

    if (error) throw error;

    await auditLog('user_notification_created', 'user_notification', data.id, {
      user_id: request.user_id,
      title: request.title,
      notification_type: request.notification_type
    });

    return data;
  }

  static async broadcastNotification(request: Omit<SendNotificationRequest, 'user_id'> & {
    target_audience?: 'all' | 'subscribers' | 'free_users';
  }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get target users based on audience
    let userQuery = supabase.from('profiles').select('id');
    
    if (request.target_audience === 'subscribers') {
      userQuery = userQuery.not('subscription_tier', 'is', null);
    } else if (request.target_audience === 'free_users') {
      userQuery = userQuery.is('subscription_tier', null);
    }

    const { data: users, error: userError } = await userQuery;
    if (userError) throw userError;

    // Create notifications for all target users
    const notifications = users?.map(targetUser => ({
      admin_user_id: user.id,
      user_id: targetUser.id,
      title: request.title,
      message: request.message,
      notification_type: request.notification_type || 'info',
      priority: request.priority || 'normal',
      action_url: request.action_url,
      action_label: request.action_label,
      metadata: request.metadata || {},
      expires_at: request.expires_at
    })) || [];

    if (notifications.length > 0) {
      const { error } = await supabase
        .from('user_notifications')
        .insert(notifications);

      if (error) throw error;

      await auditLog('notification_broadcast', 'user_notification', null, {
        target_audience: request.target_audience,
        title: request.title,
        user_count: notifications.length
      });
    }
  }

  private static async broadcastAnnouncementNotification(announcement: PlatformAnnouncement): Promise<void> {
    await this.broadcastNotification({
      target_audience: announcement.target_audience as 'all' | 'subscribers' | 'free_users',
      title: `New Announcement: ${announcement.title}`,
      message: announcement.content.substring(0, 200) + (announcement.content.length > 200 ? '...' : ''),
      notification_type: 'announcement',
      priority: announcement.priority,
      action_url: '/announcements',
      action_label: 'View Announcement'
    });
  }

  // Statistics
  static async getCommunicationStats(): Promise<CommunicationStats> {
    const [messagesResult, ticketsResult, announcementsResult] = await Promise.all([
      supabase.from('admin_messages').select('id, status', { count: 'exact' }),
      supabase.from('support_tickets').select('id, status, created_at', { count: 'exact' }),
      supabase.from('platform_announcements').select('id, status', { count: 'exact' })
    ]);

    const totalMessages = messagesResult.count || 0;
    const unreadMessages = messagesResult.data?.filter(m => m.status === 'sent').length || 0;
    const activeTickets = ticketsResult.data?.filter(t => ['open', 'in_progress'].includes(t.status)).length || 0;
    const resolvedToday = ticketsResult.data?.filter(t => 
      t.status === 'resolved' && 
      new Date(t.created_at).toDateString() === new Date().toDateString()
    ).length || 0;
    const pendingAnnouncements = announcementsResult.data?.filter(a => a.status === 'draft').length || 0;

    return {
      total_messages: totalMessages,
      unread_messages: unreadMessages,
      active_tickets: activeTickets,
      resolved_tickets_today: resolvedToday,
      pending_announcements: pendingAnnouncements,
      notification_delivery_rate: 0.95 // This would be calculated from delivery logs
    };
  }

  static async getSupportTicketStats(): Promise<SupportTicketStats> {
    const { data: tickets, error } = await supabase
      .from('support_tickets')
      .select('id, status, category, priority, created_at, resolved_at');

    if (error) throw error;

    const totalTickets = tickets?.length || 0;
    const openTickets = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressTickets = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedToday = tickets?.filter(t => 
      t.status === 'resolved' && 
      t.resolved_at &&
      new Date(t.resolved_at).toDateString() === new Date().toDateString()
    ).length || 0;

    // Calculate average resolution time
    const resolvedTickets = tickets?.filter(t => t.resolved_at) || [];
    const avgResolutionTime = resolvedTickets.length > 0 
      ? resolvedTickets.reduce((sum, ticket) => {
          const created = new Date(ticket.created_at).getTime();
          const resolved = new Date(ticket.resolved_at!).getTime();
          return sum + (resolved - created);
        }, 0) / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Group by category and priority
    const ticketsByCategory = tickets?.reduce((acc, ticket) => {
      acc[ticket.category] = (acc[ticket.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const ticketsByPriority = tickets?.reduce((acc, ticket) => {
      acc[ticket.priority] = (acc[ticket.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return {
      total_tickets: totalTickets,
      open_tickets: openTickets,
      in_progress_tickets: inProgressTickets,
      resolved_today: resolvedToday,
      avg_resolution_time: avgResolutionTime,
      tickets_by_category: ticketsByCategory,
      tickets_by_priority: ticketsByPriority
    };
  }
}