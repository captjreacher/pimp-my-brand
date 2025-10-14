import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadStep } from "@/components/wizard/UploadStep";
import { FormatStep } from "@/components/wizard/FormatStep";
import { LogoStep } from "@/components/wizard/LogoStep";
import { GenerateStep } from "@/components/wizard/GenerateStep";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateBrand() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [corpus, setCorpus] = useState("");
  const [uploadIds, setUploadIds] = useState<string[]>([]);
  const [format, setFormat] = useState("custom");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandData, setBrandData] = useState<any>(null);

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
      // If CV was generated, navigate to a page that shows both
      navigate(`/brand/${brandId}?cv=${cvId}`);
    } else {
      // Just brand generated
      navigate(`/brand/${brandId}`);
    }
  };

  return (
    <div className="min-h-screen bg-bg py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {step < 4 && (
          <Button
            variant="ghost"
            onClick={() => step > 1 ? setStep(step - 1) : navigate("/dashboard")}
            className="mb-6"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        )}

        <div className="bg-surface/50 border border-border rounded-2xl p-8 shadow-soft">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`h-2 rounded-full transition-all ${
                  s === step
                    ? "w-12 bg-primary"
                    : s < step
                    ? "w-8 bg-primary/50"
                    : "w-8 bg-border"
                }`}
              />
            ))}
          </div>

          {step === 1 && <UploadStep onComplete={handleUploadComplete} />}
          {step === 2 && <FormatStep onComplete={handleFormatComplete} />}
          {step === 3 && (
            <LogoStep 
              brandData={brandData}
              onComplete={handleLogoComplete}
              onSkip={() => handleLogoComplete(null)}
            />
          )}
          {step === 4 && (
            <GenerateStep
              corpus={corpus}
              uploadIds={uploadIds}
              format={format}
              logoUrl={logoUrl}
              onComplete={handleGenerateComplete}
              onBrandDataGenerated={setBrandData}
            />
          )}
        </div>
      </div>
    </div>
  );
}
