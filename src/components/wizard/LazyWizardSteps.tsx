import { lazy, Suspense } from "react";
import { LoadingSkeleton } from "../ui/loading-skeleton";

// Lazy load wizard steps for better code splitting
const UploadStep = lazy(() => import("./UploadStep"));
const FormatStep = lazy(() => import("./FormatStep"));
const GenerateStep = lazy(() => import("./GenerateStep"));
const LogoStep = lazy(() => import("./LogoStep"));

interface LazyWizardStepProps {
  step: 'upload' | 'format' | 'generate' | 'logo';
  [key: string]: any;
}

export function LazyWizardStep({ step, ...props }: LazyWizardStepProps) {
  const getStepComponent = () => {
    switch (step) {
      case 'upload':
        return <UploadStep {...props} />;
      case 'format':
        return <FormatStep {...props} />;
      case 'generate':
        return <GenerateStep {...props} />;
      case 'logo':
        return <LogoStep {...props} />;
      default:
        return <div>Unknown step</div>;
    }
  };

  return (
    <Suspense fallback={<LoadingSkeleton className="h-96" />}>
      {getStepComponent()}
    </Suspense>
  );
}

// Export individual lazy components for direct use
export const LazyUploadStep = (props: any) => (
  <Suspense fallback={<LoadingSkeleton className="h-96" />}>
    <UploadStep {...props} />
  </Suspense>
);

export const LazyFormatStep = (props: any) => (
  <Suspense fallback={<LoadingSkeleton className="h-96" />}>
    <FormatStep {...props} />
  </Suspense>
);

export const LazyGenerateStep = (props: any) => (
  <Suspense fallback={<LoadingSkeleton className="h-96" />}>
    <GenerateStep {...props} />
  </Suspense>
);

export const LazyLogoStep = (props: any) => (
  <Suspense fallback={<LoadingSkeleton className="h-96" />}>
    <LogoStep {...props} />
  </Suspense>
);