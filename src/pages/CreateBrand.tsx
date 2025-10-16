import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Home, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, lazy } from "react";

const UploadStep = lazy(() => import("@/components/wizard/UploadStep").then(m => ({ default: m.UploadStep })));
const FormatStep = lazy(() => import("@/components/wizard/FormatStep").then(m => ({ default: m.FormatStep })));
const LogoStep = lazy(() => import("@/components/wizard/LogoStep").then(m => ({ default: m.LogoStep })));
const GenerateStep = lazy(() => import("@/components/wizard/GenerateStep").then(m => ({ default: m.GenerateStep })));

export default function CreateBrand() {
  const navigate = useNavigate();
  
  const [step, setStep] = useState(() => {
    localStorage.removeItem('wizard-step');
    localStorage.removeItem('wizard-corpus');
    localStorage.removeItem('wizard-uploadIds');
    console.log("FORCED RESET: Starting wizard on step 1");
    return 1;
  });
  
  const [corpus, setCorpus] = useState("");
  const [uploadIds, setUploadIds] = useState<string[]>([]);
  const [format, setFormat] = useState("custom");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<any>(null);
  const [hasError, setHasError] = useState(false);

  console.log("CreateBrand render - Current step:", step);
  console.log("CreateBrand render - Corpus:", corpus);
  console.log("CreateBrand render - UploadIds:", uploadIds);

  const handleUploadComplete = (newCorpus: string, ids: string[]) => {
    setCorpus(newCorpus);
    setUploadIds(ids);
    setStep(2);
  };

  const handleFormatComplete = (selectedFormat: string) => {
    setFormat(selectedFormat);
    setStep(3);
  };

  const handleLogoComplete = (url: string | null) => {
    setLogoUrl(url);
    setStep(4);
  };

  const handleGenerateComplete = (brandId: string, cvId?: string) => {
    if (cvId) {
      navigate(`/brand/${brandId}?cv=${cvId}`);
    } else {
      navigate(`/brand/${brandId}`);
    }
  };

  if (hasError) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-lg">
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              
              <div className="space-y-2">
                <h2 className="font-heading text-3xl text-foreground">Something went wrong</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We encountered an error while loading the brand creation wizard. This might be due to a temporary issue.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
                <Button onClick={() => setHasError(false)} className="flex items-center gap-2">
                  Try Again
                </Button>
                <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                <Button variant="outline" onClick={() => navigate("/")} className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                If this problem persists, please try refreshing the page or contact support.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          {step < 4 && (
            <Button
              variant="ghost"
              onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
              <Home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate("/")}>
              Home
            </Button>
          </div>
        </div>

        <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-lg">
          <div className="mb-4 p-4 bg-red-900/20 border border-red-500 rounded">
            <div className="text-red-400 text-sm mb-2">DEBUG CONTROLS</div>
            <div className="flex gap-2 mb-2">
              <button onClick={() => setStep(1)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Step 1</button>
              <button onClick={() => setStep(2)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Step 2</button>
              <button onClick={() => setStep(3)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Step 3</button>
              <button onClick={() => setStep(4)} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">Step 4</button>
            </div>
            <div className="text-xs text-red-300">Current: Step {step}, Corpus: {corpus.length} chars, Uploads: {uploadIds.length}</div>
          </div>
          
          {/* Enhanced Progress indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              {[
                { num: 1, label: "Upload" },
                { num: 2, label: "Format" },
                { num: 3, label: "Logo" },
                { num: 4, label: "Generate" }
              ].map((s) => (
                <div key={s.num} className="flex flex-col items-center gap-2">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      s.num === step
                        ? "w-12 bg-primary"
                        : s.num < step
                        ? "w-10 bg-primary/70"
                        : "w-8 bg-border"
                    }`}
                  />
                  <span className={`text-xs font-medium ${
                    s.num === step
                      ? "text-primary"
                      : s.num < step
                      ? "text-primary/70"
                      : "text-muted-foreground"
                  }`}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
            
            {step === 4 && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Final step: Generate your brand and optionally create a CV
                </p>
              </div>
            )}
          </div>

          <Suspense 
            fallback={
              <div className="text-center py-12 space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Loading wizard step...</p>
                <div className="flex gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
                    Go to Dashboard
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/")}>
                    Go Home
                  </Button>
                </div>
              </div>
            }
          >
            {step === 1 && (
              <div>
                <div style={{ color: 'red', marginBottom: '1rem' }}>DEBUG: Rendering UploadStep (Step 1)</div>
                <UploadStep onComplete={handleUploadComplete} />
              </div>
            )}
            {step === 2 && (
              <div>
                <div style={{ color: 'red', marginBottom: '1rem' }}>DEBUG: Rendering FormatStep (Step 2)</div>
                <FormatStep onComplete={handleFormatComplete} />
              </div>
            )}
            {step === 3 && (
              <div>
                <div style={{ color: 'red', marginBottom: '1rem' }}>DEBUG: Rendering LogoStep (Step 3)</div>
                <LogoStep 
                  brandData={brandData}
                  onComplete={handleLogoComplete}
                  onSkip={() => handleLogoComplete(null)}
                />
              </div>
            )}
            {step === 4 && (
              <div>
                <div style={{ color: 'red', marginBottom: '1rem' }}>DEBUG: Rendering GenerateStep (Step 4)</div>
                <GenerateStep
                  corpus={corpus}
                  uploadIds={uploadIds}
                  format={format}
                  logoUrl={logoUrl}
                  onComplete={handleGenerateComplete}
                  onBrandDataGenerated={setBrandData}
                />
              </div>
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}