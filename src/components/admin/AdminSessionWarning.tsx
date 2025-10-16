import React from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSessionWarning, useAdminSession } from '@/hooks/use-admin-session';
import { cn } from '@/lib/utils';

interface AdminSessionWarningProps {
  className?: string;
}

export function AdminSessionWarning({ className }: AdminSessionWarningProps) {
  const { showWarning, timeRemaining, extendSession, dismissWarning } = useSessionWarning();

  if (!showWarning) return null;

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-md bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg p-4',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-yellow-800">
            Session Expiring Soon
          </h3>
          
          <div className="mt-1 text-sm text-yellow-700">
            <div className="flex items-center gap-1 mb-2">
              <Clock className="w-4 h-4" />
              <span>Time remaining: {timeRemaining}</span>
            </div>
            
            <p className="text-xs">
              Your admin session will expire soon. Click "Extend Session" to continue working.
            </p>
          </div>
          
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              onClick={extendSession}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              Extend Session
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={dismissWarning}
              className="border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              Dismiss
            </Button>
          </div>
        </div>
        
        <button
          onClick={dismissWarning}
          className="flex-shrink-0 text-yellow-400 hover:text-yellow-600 transition-colors"
          aria-label="Close warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Compact version for header/navbar
export function AdminSessionIndicator() {
  const { isActive, timeRemainingFormatted, isExpiringSoon } = useAdminSession();

  if (!isActive) return null;

  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
        isExpiringSoon
          ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          : 'bg-green-100 text-green-800 border border-green-200'
      )}
    >
      <Clock className="w-3 h-3" />
      <span>{timeRemainingFormatted}</span>
    </div>
  );
}