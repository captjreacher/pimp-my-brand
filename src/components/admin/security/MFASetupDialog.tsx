import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Copy, Shield, Smartphone, AlertTriangle } from 'lucide-react';
import { mfaService as AdminMFAService, type MFASetupData } from '@/lib/admin/mfa-service-stub';
import { toast } from 'sonner';

interface MFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userEmail: string;
  onSetupComplete: () => void;
}

export function MFASetupDialog({
  open,
  onOpenChange,
  userId,
  userEmail,
  onSetupComplete
}: MFASetupDialogProps) {
  const [step, setStep] = useState<'setup' | 'verify' | 'backup'>('setup');
  const [setupData, setSetupData] = useState<MFASetupData | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mfaService = AdminMFAService.getInstance();

  const handleSetupMFA = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const data = await mfaService.setupMFA(userId, userEmail);
      setSetupData(data);
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Setup failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result = await mfaService.verifyMFASetup(userId, verificationCode);
      
      if (result.success) {
        setStep('backup');
      } else {
        setError(result.error || 'Verification failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = () => {
    onSetupComplete();
    onOpenChange(false);
    setStep('setup');
    setSetupData(null);
    setVerificationCode('');
    setError(null);
    toast.success('Multi-factor authentication has been enabled');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      const codes = setupData.backupCodes.join('\n');
      copyToClipboard(codes);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Setup Multi-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            Add an extra layer of security to your admin account
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'setup' && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Multi-factor authentication adds an extra layer of security by requiring
              a verification code from your authenticator app in addition to your password.
            </div>
            
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">What you'll need:</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4" />
                  An authenticator app (Google Authenticator, Authy, etc.)
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSetupMFA} disabled={isLoading}>
                {isLoading ? 'Setting up...' : 'Continue'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'verify' && setupData && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Scan the QR code with your authenticator app, then enter the 6-digit code.
            </div>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  {/* QR Code placeholder - in production, generate actual QR code */}
                  <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-xs text-muted-foreground text-center">
                      QR Code<br />
                      <span className="text-xs">
                        {setupData.qrCodeUrl}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Manual entry key:</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-xs break-all">
                        {setupData.secret}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(setupData.secret)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
              />
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('setup')}>
                Back
              </Button>
              <Button onClick={handleVerifyCode} disabled={isLoading}>
                {isLoading ? 'Verifying...' : 'Verify & Enable'}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'backup' && setupData && (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Save these backup codes in a secure location. You can use them to access
              your account if you lose your authenticator device.
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Each backup code can only be used once. Store them securely!
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  Backup Codes
                  <Button size="sm" variant="outline" onClick={copyBackupCodes}>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {setupData.backupCodes.map((code, index) => (
                    <Badge key={index} variant="secondary" className="font-mono">
                      {code}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <DialogFooter>
              <Button onClick={handleComplete} className="w-full">
                I've Saved My Backup Codes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}