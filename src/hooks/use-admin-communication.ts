import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CommunicationAPI } from '@/lib/admin/api/communication-routes';
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
  CommunicationStats,
  SupportTicketStats
} from '@/lib/admin/types/communication-types';

// Messages Hook
export function useAdminMessages(filters: MessageFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['admin-messages', filters, page, limit],
    queryFn: () => CommunicationAPI.getMessages(filters, page, limit),
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: SendMessageRequest) => CommunicationAPI.sendMessage(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] });
    },
  });
}

// Announcements Hook
export function useAnnouncements(filters: AnnouncementFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['platform-announcements', filters, page, limit],
    queryFn: () => CommunicationAPI.getAnnouncements(filters, page, limit),
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateAnnouncementRequest) => CommunicationAPI.createAnnouncement(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
    },
  });
}

export function usePublishAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (announcementId: string) => CommunicationAPI.publishAnnouncement(announcementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-announcements'] });
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] });
    },
  });
}

// Support Tickets Hook
export function useSupportTickets(filters: SupportTicketFilters = {}, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['support-tickets', filters, page, limit],
    queryFn: () => CommunicationAPI.getSupportTickets(filters, page, limit),
  });
}

export function useSupportTicket(ticketId: string) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: () => CommunicationAPI.getSupportTicket(ticketId),
    enabled: !!ticketId,
  });
}

export function useTicketMessages(ticketId: string) {
  return useQuery({
    queryKey: ['ticket-messages', ticketId],
    queryFn: () => CommunicationAPI.getTicketMessages(ticketId),
    enabled: !!ticketId,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: CreateSupportTicketRequest) => CommunicationAPI.createSupportTicket(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
    },
  });
}

export function useUpdateSupportTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, request }: { ticketId: string; request: UpdateSupportTicketRequest }) =>
      CommunicationAPI.updateSupportTicket(ticketId, request),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
    },
  });
}

export function useAddTicketMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketId, request }: { ticketId: string; request: AddTicketMessageRequest }) =>
      CommunicationAPI.addTicketMessage(ticketId, request),
    onSuccess: (_, { ticketId }) => {
      queryClient.invalidateQueries({ queryKey: ['ticket-messages', ticketId] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket', ticketId] });
    },
  });
}

// Notifications Hook
export function useSendNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: SendNotificationRequest) => CommunicationAPI.sendNotification(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] });
    },
  });
}

export function useBroadcastNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (request: Omit<SendNotificationRequest, 'user_id'> & {
      target_audience?: 'all' | 'subscribers' | 'free_users';
    }) => CommunicationAPI.broadcastNotification(request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
      queryClient.invalidateQueries({ queryKey: ['communication-stats'] });
    },
  });
}

// System Notifications
export function useBroadcastMaintenanceNotification() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ scheduledTime, duration, description }: {
      scheduledTime: string;
      duration: string;
      description?: string;
    }) => CommunicationAPI.broadcastMaintenanceNotification(scheduledTime, duration, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });
}

export function useBroadcastSecurityAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ title, message, actionRequired }: {
      title: string;
      message: string;
      actionRequired?: { url: string; label: string };
    }) => CommunicationAPI.broadcastSecurityAlert(title, message, actionRequired),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });
}

export function useBroadcastFeatureAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ title, description, featureUrl }: {
      title: string;
      description: string;
      featureUrl?: string;
    }) => CommunicationAPI.broadcastFeatureAnnouncement(title, description, featureUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-notifications'] });
    },
  });
}

// Statistics
export function useCommunicationStats() {
  return useQuery({
    queryKey: ['communication-stats'],
    queryFn: () => CommunicationAPI.getCommunicationStats(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

export function useSupportTicketStats() {
  return useQuery({
    queryKey: ['support-ticket-stats'],
    queryFn: () => CommunicationAPI.getSupportTicketStats(),
    refetchInterval: 30000,
  });
}

export function useDeliveryStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ['delivery-stats', dateFrom, dateTo],
    queryFn: () => CommunicationAPI.getDeliveryStats(dateFrom, dateTo),
  });
}

// Utility Hooks
export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: () => CommunicationAPI.getAdminUsers(),
  });
}

export function useMessageTemplates() {
  return useQuery({
    queryKey: ['message-templates'],
    queryFn: () => CommunicationAPI.getMessageTemplates(),
  });
}

// Bulk Operations
export function useBulkUpdateTickets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ticketIds, updates }: { ticketIds: string[]; updates: UpdateSupportTicketRequest }) =>
      CommunicationAPI.bulkUpdateTickets(ticketIds, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-stats'] });
    },
  });
}

// Real-time Communication State
export function useCommunicationState() {
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [messageFilters, setMessageFilters] = useState<MessageFilters>({});
  const [ticketFilters, setTicketFilters] = useState<SupportTicketFilters>({});
  const [announcementFilters, setAnnouncementFilters] = useState<AnnouncementFilters>({});

  return {
    selectedTicket,
    setSelectedTicket,
    messageFilters,
    setMessageFilters,
    ticketFilters,
    setTicketFilters,
    announcementFilters,
    setAnnouncementFilters,
  };
}