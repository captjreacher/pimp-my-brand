import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Upload, 
  FileText, 
  IdCard, 
  User, 
  Sparkles,
  ArrowRight,
  Home
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  path: string;
  completed: boolean;
}

export default function Onboarding() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuthAndOnboardingStatus();
  }, []);

  const checkAuthAndOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate('/auth');
        return;
      }

      setUserId(user.id);

      // Check if user has already completed onboarding by checking if they have content
      const [brandsResult, cvsResult, uploadsResult] = await Promise.all([
        supabase.from('brands').select('id').eq('user_id', user.id).limit(1),
        supabase.from('cvs').select('id').eq('user_id', user.id).limit(1),
        supabase.from('uploads').select('id').eq('user_id', user.id).limit(1),
      ]);

      const hasAnyContent = 
        (brandsResult.data?.length || 0) > 0 ||
        (cvsResult.data?.length || 0) > 0 ||
        (uploadsResult.data?.length || 0) > 0;

      if (hasAnyContent) {
        // User has content, they've been through onboarding, redirect to dashboard
        navigate('/dashboard');
        return;
      }

      await loadOnboardingSteps(user.id);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      navigate('/auth');
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingSteps = async (userId: string) => {
    try {
      // Check completion status for each step
      const [brandsResult, cvsResult, uploadsResult, profileResult] = await Promise.all([
        supabase.from('brands').select('id').eq('user_id', userId).limit(1),
        supabase.from('cvs').select('id').eq('user_id', userId).limit(1),
        supabase.from('uploads').select('id').eq('user_id', userId).limit(1),
        supabase.from('profiles').select('display_name, bio').eq('id', userId).single(),
      ]);

      const hasProfile = profileResult.data?.display_name || profileResult.data?.bio;
      const hasBrands = (brandsResult.data?.length || 0) > 0;
      const hasCVs = (cvsResult.data?.length || 0) > 0;
      const hasUploads = (uploadsResult.data?.length || 0) > 0;

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'profile',
          title: 'Complete Your Profile',
          description: 'Add your name, bio, and professional information to get started',
          icon: <User className="w-6 h-6" />,
          action: 'Set up profile',
          path: '/profile',
          completed: !!hasProfile,
        },
        {
          id: 'upload',
          title: 'Upload Your First Document',
          description: 'Upload a resume, bio, or any professional document to analyze your writing style',
          icon: <Upload className="w-6 h-6" />,
          action: 'Upload document',
          path: '/create',
          completed: hasUploads,
        },
        {
          id: 'brand',
          title: 'Create Your Brand Rider',
          description: 'Generate your first professional brand document using AI analysis',
          icon: <FileText className="w-6 h-6" />,
          action: 'Create brand',
          path: '/create',
          completed: hasBrands,
        },
        {
          id: 'cv',
          title: 'Generate Your CV',
          description: 'Create a professional CV using your brand style and documents',
          icon: <IdCard className="w-6 h-6" />,
          action: hasBrands ? 'Generate CV' : 'Complete previous steps',
          path: hasBrands ? 'generate-cv' : '/create',
          completed: hasCVs,
        },
      ];

      setSteps(onboardingSteps);
    } catch (error) {
      console.error('Error loading onboarding steps:', error);
    }
  };

  const handleStepAction = async (step: OnboardingStep) => {
    if (step.id === 'cv' && step.path === 'generate-cv') {
      // Special handling for CV generation
      try {
        const { data: brands } = await supabase
          .from('brands')
          .select('id')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (brands && brands.length > 0) {
          navigate(`/brand/${brands[0].id}/generate-cv`);
        } else {
          navigate('/create');
        }
      } catch (error) {
        console.error('Error fetching brands:', error);
        navigate('/create');
      }
    } else {
      navigate(step.path);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!userId) return;

    try {
      // Just navigate to dashboard - onboarding completion is tracked by having content
      toast.success('Welcome to Brand Generator! 🎉');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  const handleSkipOnboarding = async () => {
    await handleCompleteOnboarding();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const isComplete = completedSteps === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-heading text-4xl font-bold">Welcome to Brand Generator!</h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Let's get you set up to create professional brand documents and CVs using AI-powered analysis
          </p>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Getting Started</CardTitle>
              <Badge variant={isComplete ? "default" : "secondary"} className="text-sm">
                {completedSteps} of {totalSteps} completed
              </Badge>
            </div>
            <Progress value={progress} className="h-3 mt-4" />
          </CardHeader>
        </Card>

        {/* Onboarding Steps */}
        <div className="space-y-6 mb-8">
          {steps.map((step, index) => (
            <OnboardingStepCard
              key={step.id}
              step={step}
              stepNumber={index + 1}
              isNext={!step.completed && steps.slice(0, index).every(s => s.completed)}
              onAction={() => handleStepAction(step)}
            />
          ))}
        </div>

        {/* Completion Actions */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
          <CardContent className="p-8 text-center">
            {isComplete ? (
              <div className="space-y-6">
                <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Congratulations! 🎉</h3>
                  <p className="text-muted-foreground mb-6">
                    You've completed the onboarding process. You're ready to create amazing professional content!
                  </p>
                  <Button onClick={handleCompleteOnboarding} size="lg" className="gap-2">
                    <Home className="w-5 h-5" />
                    Go to Dashboard
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold">Ready to explore?</h3>
                <p className="text-muted-foreground">
                  You can complete the remaining steps later from your dashboard
                </p>
                <div className="flex gap-4 justify-center">
                  <Button variant="outline" onClick={handleSkipOnboarding}>
                    Skip for now
                  </Button>
                  <Button onClick={() => handleStepAction(steps.find(s => !s.completed) || steps[0])}>
                    Continue setup
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface OnboardingStepCardProps {
  step: OnboardingStep;
  stepNumber: number;
  isNext: boolean;
  onAction: () => void;
}

function OnboardingStepCard({ step, stepNumber, isNext, onAction }: OnboardingStepCardProps) {
  return (
    <Card className={`transition-all ${
      step.completed 
        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30' 
        : isNext
        ? 'bg-primary/5 border-primary/20 shadow-md ring-1 ring-primary/10'
        : 'bg-muted/30 border-border'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-6">
          {/* Step Number & Icon */}
          <div className="flex flex-col items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
              step.completed 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isNext
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.completed ? <CheckCircle className="w-6 h-6" /> : stepNumber}
            </div>
            <div className={`p-3 rounded-lg ${
              step.completed 
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isNext
                ? 'bg-primary/10 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {step.icon}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className={`text-xl font-semibold ${
                step.completed ? 'text-green-700 dark:text-green-400' : ''
              }`}>
                {step.title}
              </h3>
              {step.completed && (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Complete
                </Badge>
              )}
              {isNext && (
                <Badge variant="default">
                  Next
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mb-4">
              {step.description}
            </p>
            
            {!step.completed && (
              <Button
                variant={isNext ? "default" : "outline"}
                onClick={onAction}
                className="gap-2"
                disabled={step.action === 'Complete previous steps'}
              >
                {step.action}
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}