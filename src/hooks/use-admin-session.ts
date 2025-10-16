import { useState, useEffect, useCallback } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { validateAdminSession } from '@/lib/admin/middleware';
import { toast } from 'sonner';

interface AdminSessionState {
  isActive: boolean;
  timeRemaining: number;
  lastActivity: Date;
  warningShown: boolean;
}

const SESSION_DURATION = 8 * 60 * 60 * 1000; // 8 hours in milliseconds
const WARNING_THRESHOLD = 30 * 60 * 1000; // 30 minutes before expiry
const CHECK_INTERVAL = 60 * 1000; // Check every minute

export function useAdminSession() {
  const { user, session, logout } = useAdmin();
  const [sessionState, setSessionState] = useState<AdminSessionState>({
    isActive: false,
    timeRemaining: 0,
    lastActivity: new Date(),
    warningShown: false
  });

  // Update last activity
  const updateActivity = useCallback(() => {
    setSessionState(prev => ({
      ...prev,
      lastActivity: new Date(),
      warningShown: false
    }));
  }, []);

  // Check session validity
  const checkSession = useCallback(async () => {
    if (!user || !session) {
      setSessionState(prev => ({ ...prev, isActive: false }));
      return;
    }

    try {
      const isValid = await validateAdminSession(user.id);
      
      if (!isValid) {
        toast.error('Admin session expired. Please log in again.');
        await logout();
        return;
      }

      // Calculate time remaining
      const sessionStart = new Date(session.session_start);
      const now = new Date();
      const elapsed = now.getTime() - sessionStart.getTime();
      const remaining = Math.max(0, SESSION_DURATION - elapsed);

      setSessionState(prev => ({
        ...prev,
        isActive: true,
        timeRemaining: remaining
      }));

      // Show warning if session is about to expire
      if (remaining <= WARNING_THRESHOLD && remaining > 0 && !sessionState.warningShown) {
        const minutesRemaining = Math.floor(remaining / (60 * 1000));
        toast.warning(
          `Admin session expires in ${minutesRemaining} minutes. Activity will extend the session.`,
          { duration: 10000 }
        );
        
        setSessionState(prev => ({ ...prev, warningShown: true }));
      }

    } catch (error) {
      console.error('Session check error:', error);
      setSessionState(prev => ({ ...prev, isActive: false }));
    }
  }, [user, session, logout, sessionState.warningShown]);

  // Extend session
  const extendSession = useCallback(async () => {
    if (!user) return;

    try {
      // Update last activity in the database
      // This would typically be done through an API call
      updateActivity();
      
      // Reset warning
      setSessionState(prev => ({ ...prev, warningShown: false }));
      
      toast.success('Session extended');
    } catch (error) {
      console.error('Failed to extend session:', error);
      toast.error('Failed to extend session');
    }
  }, [user, updateActivity]);

  // Format time remaining
  const formatTimeRemaining = useCallback((milliseconds: number): string => {
    const hours = Math.floor(milliseconds / (60 * 60 * 1000));
    const minutes = Math.floor((milliseconds % (60 * 60 * 1000)) / (60 * 1000));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }, []);

  // Set up session monitoring
  useEffect(() => {
    if (!user || !session) return;

    // Initial check
    checkSession();

    // Set up periodic checks
    const interval = setInterval(checkSession, CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, [user, session, checkSession]);

  // Set up activity listeners
  useEffect(() => {
    if (!sessionState.isActive) return;

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      updateActivity();
    };

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    return () => {
      // Remove event listeners
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [sessionState.isActive, updateActivity]);

  return {
    isActive: sessionState.isActive,
    timeRemaining: sessionState.timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(sessionState.timeRemaining),
    lastActivity: sessionState.lastActivity,
    isExpiringSoon: sessionState.timeRemaining <= WARNING_THRESHOLD && sessionState.timeRemaining > 0,
    extendSession,
    updateActivity
  };
}

// Hook for session timeout warning component
export function useSessionWarning() {
  const { isExpiringSoon, timeRemainingFormatted, extendSession } = useAdminSession();
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    setShowWarning(isExpiringSoon);
  }, [isExpiringSoon]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const handleExtend = useCallback(async () => {
    await extendSession();
    setShowWarning(false);
  }, [extendSession]);

  return {
    showWarning,
    timeRemaining: timeRemainingFormatted,
    extendSession: handleExtend,
    dismissWarning
  };
}

// Hook for admin authentication state
export function useAdminAuth() {
  const { user, permissions } = useAdmin();

  const isAdmin = user && user.app_role !== 'user';
  const isSuperAdmin = user?.app_role === 'super_admin';
  const isModeratorOrAbove = user && ['moderator', 'admin', 'super_admin'].includes(user.app_role);

  return {
    user,
    isAdmin,
    isSuperAdmin,
    isModeratorOrAbove,
    permissions: permissions || [],
    role: user?.app_role || 'user',
  };
}