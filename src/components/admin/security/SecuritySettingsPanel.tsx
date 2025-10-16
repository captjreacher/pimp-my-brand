import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Smartphone,
  Globe,
  Clock,
  AlertTriangle,
  Plus,
  X,
  Settings
} from 'lucide-react';
import { mfaService as AdminMFAService, type AdminSecuritySettings } from '@/lib/admin/mfa-service-stub';
import { EnhancedAdminSecurityService } from '@/lib/admin/enhanced-security-service';
import { MFASetupDialog } from './MFASetupDialog';
import { toast } from 'sonner';

interface SecuritySettingsPanelProps {
  userId: string;
  userEmail: string;
}

export function SecuritySettingsPanel({ userId, userEmail }: SecuritySettingsPanelProps) {
  const [settings, setSettings] = useState<AdminSecuritySettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showMFASetup, setShowMFASetup] = useState(false);
  const [newIPAddress, setNewIPAddress] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState(480); // 8 hours default

  const mfaService = AdminMFAService.getInstance();
  const securityService = EnhancedAdminSecurityService.getInstance();

  useEffect(() => {
    loadSecuritySettings();
  }, [userId]);

  const loadSecuritySettings = async () => {
    try {
      setIsLoading(true);
      const data = await mfaService.getSecuritySettings(userId);
      setSettings(data);
      if (data) {
        setSessionTimeout(data.session_timeout_minutes);
      }
    } catch (error) {
      console.error('Failed to load security settings:', error);
      toast.error('Failed to load security settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAToggle = async (enabled: boolean) => {
    if (enabled) {
      setShowMFASetup(true);
    } else {
      try {
        setIsSaving(true);
        await mfaService.disableMFA(userId);
        await loadSecuritySettings();
        toast.success('Multi-factor authentication disabled');
      } catch (error) {
        toast.error('Failed to disable MFA');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleIPRestrictionToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      await securityService.setIPRestriction(userId, enabled);
      await loadSecuritySettings();
      toast.success(`IP restrictions ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update IP restriction setting');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddIPAddress = async () => {
    if (!newIPAddress.trim()) return;

    try {
      const currentIPs = settings?.ip_allowlist || [];
      const updatedIPs = [...currentIPs, newIPAddress.trim()];
      
      await securityService.updateIPAllowlist(userId, updatedIPs);
      await loadSecuritySettings();
      setNewIPAddress('');
      toast.success('IP address added to allowlist');
    } catch (error) {
      toast.error('Failed to add IP address');
    }
  };

  const handleRemoveIPAddress = async (ipToRemove: string) => {
    try {
      const currentIPs = settings?.ip_allowlist || [];
      const updatedIPs = currentIPs.filter(ip => ip !== ipToRemove);
      
      await securityService.updateIPAllowlist(userId, updatedIPs);
      await loadSecuritySettings();
      toast.success('IP address removed from allowlist');
    } catch (error) {
      toast.error('Failed to remove IP address');
    }
  };

  const handleSessionTimeoutUpdate = async () => {
    try {
      setIsSaving(true);
      await securityService.updateSessionTimeout(userId, sessionTimeout);
      await loadSecuritySettings();
      toast.success('Session timeout updated');
    } catch (error) {
      toast.error('Failed to update session timeout');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSensitiveActionsToggle = async (enabled: boolean) => {
    try {
      setIsSaving(true);
      await mfaService.updateSecuritySettings(userId, {
        require_mfa_for_sensitive_actions: enabled
      });
      await loadSecuritySettings();
      toast.success(`MFA for sensitive actions ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update sensitive actions setting');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Security Settings</h2>
      </div>

      {/* Multi-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            Multi-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security with time-based verification codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Enable MFA</div>
              <div className="text-sm text-muted-foreground">
                Require verification codes for admin access
              </div>
            </div>
            <Switch
              checked={settings?.mfa_enabled || false}
              onCheckedChange={handleMFAToggle}
              disabled={isSaving}
            />
          </div>

          {settings?.mfa_enabled && (
            <>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">Require MFA for sensitive actions</div>
                  <div className="text-sm text-muted-foreground">
                    Require MFA verification for critical admin operations
                  </div>
                </div>
                <Switch
                  checked={settings?.require_mfa_for_sensitive_actions || false}
                  onCheckedChange={handleSensitiveActionsToggle}
                  disabled={isSaving}
                />
              </div>
            </>
          )}

          {settings?.mfa_enabled && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                MFA is active. Make sure to keep your authenticator app and backup codes secure.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* IP Address Restrictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            IP Address Restrictions
          </CardTitle>
          <CardDescription>
            Limit admin access to specific IP addresses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">Enable IP restrictions</div>
              <div className="text-sm text-muted-foreground">
                Only allow admin access from approved IP addresses
              </div>
            </div>
            <Switch
              checked={settings?.ip_restriction_enabled || false}
              onCheckedChange={handleIPRestrictionToggle}
              disabled={isSaving}
            />
          </div>

          {settings?.ip_restriction_enabled && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Allowed IP Addresses</Label>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter IP address (e.g., 192.168.1.1)"
                    value={newIPAddress}
                    onChange={(e) => setNewIPAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddIPAddress()}
                  />
                  <Button onClick={handleAddIPAddress} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {settings?.ip_allowlist && settings.ip_allowlist.length > 0 ? (
                  <div className="space-y-2">
                    {settings.ip_allowlist.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                        <code className="text-sm">{ip}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveIPAddress(ip)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No IP addresses in allowlist. You may lose access if you enable restrictions.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Session Management
          </CardTitle>
          <CardDescription>
            Configure session timeout and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="session-timeout">Session Timeout (minutes)</Label>
            <div className="flex gap-2">
              <Input
                id="session-timeout"
                type="number"
                min="30"
                max="1440"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 480)}
              />
              <Button onClick={handleSessionTimeoutUpdate} disabled={isSaving}>
                Update
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              Sessions will automatically expire after this period of inactivity
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-2xl font-bold">{Math.floor(sessionTimeout / 60)}h {sessionTimeout % 60}m</div>
              <div className="text-sm text-muted-foreground">Current timeout</div>
            </div>
            <div className="text-center p-3 bg-muted rounded">
              <div className="text-2xl font-bold">
                {settings?.mfa_enabled ? (
                  <Badge variant="default">High</Badge>
                ) : (
                  <Badge variant="secondary">Standard</Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">Security level</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <MFASetupDialog
        open={showMFASetup}
        onOpenChange={setShowMFASetup}
        userId={userId}
        userEmail={userEmail}
        onSetupComplete={loadSecuritySettings}
      />
    </div>
  );
}