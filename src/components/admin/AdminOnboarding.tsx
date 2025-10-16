import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Users, 
  Flag, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Shield, 
  CheckCircle, 
  ArrowRight,
  X,
  HelpCircle,
  BookOpen,
  Video,
  MessageSquare
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  path: string;
  requiredPermissions?: string[];
  completed: boolean;
  optional?: boolean;
}

interface AdminOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function AdminOnboarding({ isOpen, onClose, onComplete }: AdminOnboardingProps) {
  const { user, permissions, checkPermission } = useAdmin();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // Load completed steps from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`admin-onboarding-${user?.id}`);
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  }, [user?.id]);

  // Save completed steps to localStorage
  const saveProgress = (steps: Set<string>) => {
    localStorage.setItem(`admin-onboarding-${user?.id}`, JSON.stringify([...steps]));
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Admin Panel',
      description: 'Get familiar with your admin dashboard and available features.',
      icon: Shield,
      path: '/admin',
      completed: completedSteps.has('welcome'),
    },
    {
      id: 'user-management',
      title: 'User Management',
      description: 'Learn how to manage user accounts, roles, and permissions.',
      icon: Users,
      path: '/admin/users',
      requiredPermissions: ['manage_users'],
      completed: completedSteps.has('user-management'),
    },
    {
      id: 'content-moderation',
      title: 'Content Moderation',
      description: 'Review and moderate user-generated content effectively.',
      icon: Flag,
      path: '/admin/moderation',
      requiredPermissions: ['moderate_content'],
      completed: completedSteps.has('content-moderation'),
    },
    {
      id: 'subscription-management',
      title: 'Subscription Management',
      description: 'Handle billing, subscriptions, and payment issues.',
      icon: CreditCard,
      path: '/admin/subscriptions',
      requiredPermissions: ['manage_billing'],
      completed: completedSteps.has('subscription-management'),
    },
    {
      id: 'analytics',
      title: 'Analytics & Monitoring',
      description: 'Monitor system health and analyze platform metrics.',
      icon: BarChart3,
      path: '/admin/analytics',
      requiredPermissions: ['view_analytics'],
      completed: completedSteps.has('analytics'),
    },
    {
      id: 'system-config',
      title: 'System Configuration',
      description: 'Configure platform settings and feature flags.',
      icon: Settings,
      path: '/admin/config',
      requiredPermissions: ['manage_system'],
      completed: completedSteps.has('system-config'),
      optional: true,
    },
  ];

  // Filter steps based on user permissions
  const availableSteps = onboardingSteps.filter(step => {
    if (!step.requiredPermissions) return true;
    return step.requiredPermissions.every(permission => checkPermission(permission));
  });

  const totalSteps = availableSteps.filter(step => !step.optional).length;
  const completedCount = availableSteps.filter(step => step.completed && !step.optional).length;
  const progress = (completedCount / totalSteps) * 100;

  const markStepCompleted = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    saveProgress(newCompleted);
  };

  const handleStepClick = (step: OnboardingStep, index: number) => {
    setCurrentStep(index);
    if (!step.completed) {
      markStepCompleted(step.id);
    }
  };

  const handleNext = () => {
    if (currentStep < availableSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as completed
    localStorage.setItem(`admin-onboarding-completed-${user?.id}`, 'true');
    onComplete();
    onClose();
  };

  const currentStepData = availableSteps[currentStep];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Admin Panel Onboarding
          </DialogTitle>
          <DialogDescription>
            Welcome to the admin panel! Let's get you familiar with the key features and capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Progress</CardTitle>
              <CardDescription>
                {completedCount} of {totalSteps} essential features explored
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={progress} className="mb-4" />
              <div className="flex flex-wrap gap-2">
                {availableSteps.map((step, index) => (
                  <Badge
                    key={step.id}
                    variant={step.completed ? "default" : "secondary"}
                    className={`cursor-pointer transition-colors ${
                      index === currentStep ? 'ring-2 ring-primary' : ''
                    }`}
                    onClick={() => handleStepClick(step, index)}
                  >
                    {step.completed && <CheckCircle className="h-3 w-3 mr-1" />}
                    {step.title}
                    {step.optional && <span className="ml-1 text-xs">(Optional)</span>}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Step Content */}
          {currentStepData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <currentStepData.icon className="h-5 w-5" />
                  {currentStepData.title}
                  {currentStepData.completed && (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <OnboardingStepContent step={currentStepData} />
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Skip for Now
              </Button>

              {currentStep === availableSteps.length - 1 ? (
                <Button onClick={handleComplete}>
                  Complete Onboarding
                </Button>
              ) : (
                <Button onClick={handleNext}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OnboardingStepContent({ step }: { step: OnboardingStep }) {
  const stepContent: Record<string, React.ReactNode> = {
    welcome: (
      <div className="space-y-4">
        <p>Welcome to the admin panel! Here's what you can do:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Monitor system health and user activity</li>
          <li>Manage user accounts and permissions</li>
          <li>Review and moderate content</li>
          <li>Handle billing and subscription issues</li>
          <li>View analytics and generate reports</li>
          <li>Configure system settings</li>
        </ul>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> Use the sidebar navigation to quickly access different admin sections.
            Your available features depend on your admin role and permissions.
          </p>
        </div>
      </div>
    ),

    'user-management': (
      <div className="space-y-4">
        <p>The User Management section allows you to:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>View and search all user accounts</li>
          <li>Update user roles and permissions</li>
          <li>Suspend or activate user accounts</li>
          <li>View user activity and content history</li>
          <li>Perform bulk operations on multiple users</li>
        </ul>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            <strong>Important:</strong> All user management actions are logged in the audit trail.
            Be careful when modifying user accounts or roles.
          </p>
        </div>
      </div>
    ),

    'content-moderation': (
      <div className="space-y-4">
        <p>Content Moderation helps you maintain platform quality:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Review flagged or reported content</li>
          <li>Approve or reject user-generated content</li>
          <li>Set up automated content filtering rules</li>
          <li>Handle content appeals and disputes</li>
          <li>Monitor content trends and patterns</li>
        </ul>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Guidelines:</strong> Follow platform content policies when moderating.
            When in doubt, escalate to senior moderators or administrators.
          </p>
        </div>
      </div>
    ),

    'subscription-management': (
      <div className="space-y-4">
        <p>Subscription Management covers billing and payments:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>View subscription metrics and revenue</li>
          <li>Handle billing issues and disputes</li>
          <li>Process refunds and cancellations</li>
          <li>Manage subscription tiers and pricing</li>
          <li>Monitor payment failures and retries</li>
        </ul>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <p className="text-sm text-green-800 dark:text-green-200">
            <strong>Integration:</strong> This section integrates with Stripe for payment processing.
            Changes here may affect real billing and should be handled carefully.
          </p>
        </div>
      </div>
    ),

    analytics: (
      <div className="space-y-4">
        <p>Analytics & Monitoring provides insights into:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>System performance and health metrics</li>
          <li>User engagement and behavior patterns</li>
          <li>Content generation and usage statistics</li>
          <li>Revenue and subscription analytics</li>
          <li>Error rates and system alerts</li>
        </ul>
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Real-time Data:</strong> Most analytics update in real-time.
            Use filters and date ranges to focus on specific time periods or user segments.
          </p>
        </div>
      </div>
    ),

    'system-config': (
      <div className="space-y-4">
        <p>System Configuration allows you to:</p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li>Manage feature flags and rollouts</li>
          <li>Configure rate limits and quotas</li>
          <li>Update API keys and integrations</li>
          <li>Set platform-wide settings</li>
          <li>Manage maintenance modes</li>
        </ul>
        <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-200">
            <strong>Caution:</strong> System configuration changes can affect all users.
            Test changes in staging environments when possible and have rollback plans ready.
          </p>
        </div>
      </div>
    ),
  };

  return (
    <div>
      {stepContent[step.id] || (
        <p>Content for this step is being prepared. Please check back later.</p>
      )}
      
      <div className="mt-6 pt-4 border-t">
        <Button asChild variant="outline" className="w-full">
          <a href={step.path} target="_blank" rel="noopener noreferrer">
            Open {step.title} Section
            <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </Button>
      </div>
    </div>
  );
}

// Hook to manage onboarding state
export function useAdminOnboarding() {
  const { user } = useAdmin();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const completed = localStorage.getItem(`admin-onboarding-completed-${user.id}`);
      setIsCompleted(!!completed);
      
      // Show onboarding for new admin users
      if (!completed && user.app_role !== 'user') {
        // Delay showing onboarding to allow page to load
        const timer = setTimeout(() => setShowOnboarding(true), 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [user]);

  const startOnboarding = () => setShowOnboarding(true);
  const completeOnboarding = () => {
    setIsCompleted(true);
    setShowOnboarding(false);
  };

  return {
    showOnboarding,
    isCompleted,
    startOnboarding,
    completeOnboarding,
    closeOnboarding: () => setShowOnboarding(false),
  };
}

// Admin Help System Component
export function AdminHelpSystem() {
  const [isOpen, setIsOpen] = useState(false);

  const helpResources = [
    {
      title: 'Admin Documentation',
      description: 'Comprehensive guide to all admin features',
      icon: BookOpen,
      action: () => window.open('/docs/admin', '_blank'),
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video guides',
      icon: Video,
      action: () => window.open('/tutorials/admin', '_blank'),
    },
    {
      title: 'Contact Support',
      description: 'Get help from our admin support team',
      icon: MessageSquare,
      action: () => window.open('mailto:admin-support@example.com', '_blank'),
    },
  ];

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        <HelpCircle className="h-4 w-4" />
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Help & Resources</DialogTitle>
            <DialogDescription>
              Get help with admin panel features and functionality
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {helpResources.map((resource, index) => (
              <Card key={index} className="cursor-pointer hover:bg-muted/50" onClick={resource.action}>
                <CardContent className="flex items-center gap-4 p-4">
                  <resource.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-medium">{resource.title}</h3>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 ml-auto" />
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}