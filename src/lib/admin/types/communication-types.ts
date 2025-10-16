// Admin Communication System Types

export interface AdminMessage {
  id: string;
  admin_user_id: string;
  recipient_user_id: string;
  subject: string;
  message: string;
  message_type: 'direct' | 'support' | 'warning' | 'notification';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'sent' | 'read' | 'archived';
  read_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  admin_user?: {
    id: string;
    email: string;
    full_name: string;
  };
  recipient_user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface PlatformAnnouncement {
  id: string;
  admin_user_id: string;
  title: string;
  content: string;
  announcement_type: 'general' | 'maintenance' | 'feature' | 'security' | 'urgent';
  target_audience: 'all' | 'subscribers' | 'free_users' | 'admins';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  scheduled_for?: string;
  published_at?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
  
  // Joined data
  admin_user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface SupportTicket {
  id: string;
  user_id: string;
  assigned_admin_id?: string;
  subject: string;
  description: string;
  category: 'general' | 'billing' | 'technical' | 'content' | 'account';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  resolution?: string;
  user_email?: string;
  user_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  closed_at?: string;
  
  // Joined data
  user?: {
    id: string;
    email: string;
    full_name: string;
  };
  assigned_admin?: {
    id: string;
    email: string;
    full_name: string;
  };
  message_count?: number;
  last_message_at?: string;
}

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  is_internal: boolean;
  attachments: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
  created_at: string;
  
  // Joined data
  sender?: {
    id: string;
    email: string;
    full_name: string;
    app_role?: string;
  };
}

export interface UserNotification {
  id: string;
  user_id: string;
  admin_user_id?: string;
  title: string;
  message: string;
  notification_type: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'unread' | 'read' | 'dismissed' | 'archived';
  action_url?: string;
  action_label?: string;
  metadata: Record<string, any>;
  expires_at?: string;
  read_at?: string;
  created_at: string;
  
  // Joined data
  admin_user?: {
    id: string;
    email: string;
    full_name: string;
  };
}

export interface NotificationDeliveryLog {
  id: string;
  notification_id?: string;
  user_id: string;
  delivery_method: 'in_app' | 'email' | 'push';
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced';
  error_message?: string;
  delivered_at?: string;
  created_at: string;
}

// Request/Response types
export interface SendMessageRequest {
  recipient_user_id: string;
  subject: string;
  message: string;
  message_type?: 'direct' | 'support' | 'warning' | 'notification';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  announcement_type?: 'general' | 'maintenance' | 'feature' | 'security' | 'urgent';
  target_audience?: 'all' | 'subscribers' | 'free_users' | 'admins';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduled_for?: string;
  expires_at?: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  description: string;
  category?: 'general' | 'billing' | 'technical' | 'content' | 'account';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  user_email?: string;
  user_metadata?: Record<string, any>;
}

export interface UpdateSupportTicketRequest {
  assigned_admin_id?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: 'open' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
  resolution?: string;
}

export interface AddTicketMessageRequest {
  message: string;
  is_internal?: boolean;
  attachments?: Array<{
    name: string;
    url: string;
    size: number;
    type: string;
  }>;
}

export interface SendNotificationRequest {
  user_id?: string;
  user_ids?: string[];
  title: string;
  message: string;
  notification_type?: 'info' | 'warning' | 'success' | 'error' | 'announcement';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  action_url?: string;
  action_label?: string;
  metadata?: Record<string, any>;
  expires_at?: string;
  delivery_methods?: Array<'in_app' | 'email' | 'push'>;
}

// Filter types
export interface MessageFilters {
  recipient_user_id?: string;
  message_type?: string;
  priority?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface AnnouncementFilters {
  announcement_type?: string;
  target_audience?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface SupportTicketFilters {
  assigned_admin_id?: string;
  category?: string;
  priority?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface NotificationFilters {
  user_id?: string;
  notification_type?: string;
  priority?: string;
  status?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

// Statistics types
export interface CommunicationStats {
  total_messages: number;
  unread_messages: number;
  active_tickets: number;
  resolved_tickets_today: number;
  pending_announcements: number;
  notification_delivery_rate: number;
}

export interface SupportTicketStats {
  total_tickets: number;
  open_tickets: number;
  in_progress_tickets: number;
  resolved_today: number;
  avg_resolution_time: number;
  tickets_by_category: Record<string, number>;
  tickets_by_priority: Record<string, number>;
}

export interface NotificationStats {
  total_sent: number;
  delivery_rate: number;
  read_rate: number;
  delivery_by_method: Record<string, {
    sent: number;
    delivered: number;
    failed: number;
  }>;
}