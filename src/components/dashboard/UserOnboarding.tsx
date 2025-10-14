import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  Circle, 
  Upload, 
  FileText, 
  IdCard, 
  User, 
  Sparkles,
  ArrowRight,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  path: string;
  completed: boolean;
}

interface UserOnboardingProps {
  userId: string;
  hasContent: boolean;
  onDismiss: () => void;
}

export function UserOnboarding({ userId, hasContent, onDismiss }: UserOnboardingProps) {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkOnboardingStatus();
  }, [userId]);

  const checkOnboardingStatus = async () => {
    try {
      // Check if user has dismissed onboarding
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if user has any content
      const [brandsResult, cvsResult, uploadsResult] = await Promise.all([
        supabase.from('brands').select('id').eq('user_id', userId).limit(1),
        supabase.from('cvs').select('id').eq('user_id', userId).limit(1),
        supabase.from('uploads').select('id').eq('user_id', userId).limit(1),
      ]);

      const hasProfile = profile?.display_name || profile?.bio;
      const hasBrands = (brandsResult.data?.length || 0) > 0;
      const hasCVs = (cvsResult.data?.length || 0) > 0;
      const hasUploads = (uploadsResult.data?.length || 0) > 0;

      const onboardingSteps: OnboardingStep[] = [
        {
          id: 'profile',
          title: 'Complete Your Profile',
          description: 'Add your name, bio, and professional information',
          icon: <User className="w-5 h-5" />,
          action: 'Set up profile',
          path: '/profile',
          completed: !!hasProfile,
        },
        {
          id: 'upload',
          title: 'Upload Your First Document',
          description: 'Upload a resume, bio, or any text document to analyze',
          icon: <Upload className="w-5 h-5" />,
          action: 'Upload document',
          path: '/create',
          completed: hasUploads,
        },
        {
          id: 'brand',
          title: 'Create Your Brand Rider',
          description: 'Generate your first professional brand document',
          icon: <FileText className="w-5 h-5" />,
          action: 'Create brand',
          path: '/create',
          completed: hasBrands,
        },
        {
          id: 'cv',
          title: 'Generate Your CV',
          description: 'Create a professional CV from your brand analysis',
          icon: <IdCard className="w-5 h-5" />,
          action: 'Generate CV',
          path: '/create',
          completed: hasCVs,
        },
      ];

      setSteps(onboardingSteps);
      
      // Show onboarding if user is new and hasn't completed all steps
      const completedSteps = onboardingSteps.filter(step => step.completed).length;
      const shouldShow = !hasContent && completedSteps < onboardingSteps.length;
      setIsVisible(shouldShow);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;

  const handleStepAction = (step: OnboardingStep) => {
    navigate(step.path);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible || completedSteps === totalSteps) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Welcome to Brand Generator!</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Let's get you started with creating your professional brand
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{completedSteps} of {totalSteps} completed</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <OnboardingStepCard
              key={step.id}
              step={step}
              isNext={!step.completed && steps.slice(0, index).every(s => s.completed)}
              onAction={() => handleStepAction(step)}
            />
          ))}
        </div>

        {completedSteps > 0 && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium">Great progress!</span>
              <span className="text-muted-foreground">
                You've completed {completedSteps} step{completedSteps !== 1 ? 's' : ''}.
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface OnboardingStepCardProps {
  step: OnboardingStep;
  isNext: boolean;
  onAction: () => void;
}

function OnboardingStepCard({ step, isNext, onAction }: OnboardingStepCardProps) {
  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
      step.completed 
        ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800/30' 
        : isNext
        ? 'bg-primary/5 border-primary/20 shadow-sm'
        : 'bg-muted/30 border-border'
    }`}>
      <div className={`p-2 rounded-lg ${
        step.completed 
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : isNext
          ? 'bg-primary/10 text-primary'
          : 'bg-muted text-muted-foreground'
      }`}>
        {step.completed ? <CheckCircle className="w-5 h-5" /> : step.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`font-medium ${step.completed ? 'text-green-700 dark:text-green-400' : ''}`}>
            {step.title}
          </h4>
          {step.completed && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Complete
            </Badge>
          )}
          {isNext && (
            <Badge variant="default" className="text-xs">
              Next
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {step.description}
        </p>
      </div>

      {!step.completed && (
        <Button
          variant={isNext ? "default" : "outline"}
          size="sm"
          onClick={onAction}
          className="gap-2"
        >
          {step.action}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}