import { BrandRider, UsageExample } from '@/lib/generators/types';
import { ColorSwatch, FontPair } from '@/lib/ai/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Palette, Type, Quote, Target, TrendingUp, AlertTriangle, Lightbulb } from 'lucide-react';

interface BrandRiderPreviewProps {
  brandRider: BrandRider;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function BrandRiderPreview({ 
  brandRider, 
  className = '', 
  showHeader = true,
  compact = false 
}: BrandRiderPreviewProps) {
  return (
    <div className={`max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 ${className}`}>
      {/* Header */}
      {showHeader && (
        <div className="text-center space-y-2 sm:space-y-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{brandRider.title}</h1>
          <p className="text-base sm:text-lg text-muted-foreground">Professional Brand Guidelines</p>
          <Badge variant="outline" className="text-xs sm:text-sm">
            {brandRider.format.toUpperCase()} Format
          </Badge>
        </div>
      )}

      <div className={`grid gap-4 sm:gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-2'}`}>
        {/* Tagline Section */}
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Tagline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <blockquote className="text-lg sm:text-xl font-semibold text-center py-3 sm:py-4 px-4 sm:px-6 bg-primary/5 rounded-lg border-l-4 border-primary">
              "{brandRider.tagline}"
            </blockquote>
          </CardContent>
        </Card>

        {/* Voice & Tone */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Voice & Tone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {brandRider.voiceTone.map((tone, index) => (
                <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                  {tone}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Signature Phrases */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Signature Phrases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 sm:space-y-3">
              {brandRider.signaturePhrases.map((phrase, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base leading-relaxed">{phrase}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Key Strengths */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
              Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 sm:space-y-3">
              {brandRider.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2 sm:gap-3">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <span className="text-sm sm:text-base leading-relaxed">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Areas for Growth (if present) */}
        {brandRider.weaknesses && brandRider.weaknesses.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                Areas for Growth
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 sm:space-y-3">
                {brandRider.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2 sm:gap-3">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                    <span className="text-sm sm:text-base leading-relaxed">{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Color Palette */}
        <Card className={compact ? '' : 'col-span-full md:col-span-1'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Palette className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Color Palette
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 sm:space-y-4">
              {brandRider.palette.map((color, index) => (
                <div key={index} className="flex items-center gap-3 sm:gap-4">
                  <div 
                    className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg border-2 border-border flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: color.hex }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{color.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground font-mono">{color.hex.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Typography */}
        <Card className={compact ? '' : 'col-span-full md:col-span-1'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Type className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Typography
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-5">
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Heading Font</p>
                <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <p className="font-bold text-base sm:text-lg truncate" style={{ fontFamily: brandRider.fonts.heading }}>
                    {brandRider.fonts.heading}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Sample heading text
                  </p>
                </div>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Body Font</p>
                <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm sm:text-base truncate" style={{ fontFamily: brandRider.fonts.body }}>
                    {brandRider.fonts.body}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Sample body text for readability
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bio */}
        <Card className="col-span-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-base sm:text-lg">Professional Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm sm:text-base leading-relaxed bg-muted/20 p-3 sm:p-4 rounded-lg">
              {brandRider.bio}
            </p>
          </CardContent>
        </Card>

        {/* Usage Examples */}
        {brandRider.examples && brandRider.examples.length > 0 && (
          <Card className="col-span-full">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">Usage Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {brandRider.examples.map((example, index) => (
                  <div key={index} className="space-y-2">
                    <Badge variant="outline" className="text-xs">
                      {example.context}
                    </Badge>
                    <div className="p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm sm:text-base leading-relaxed">{example.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Footer */}
      {!compact && (
        <div className="text-center pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Generated with {brandRider.format.toUpperCase()} format • 
            {brandRider.createdAt && ` Created ${new Date(brandRider.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}

// Mobile-optimized preview for small screens
export function BrandRiderMobilePreview({ brandRider, className = '' }: { brandRider: BrandRider; className?: string }) {
  return (
    <div className={`w-full max-w-sm mx-auto space-y-4 p-4 ${className}`}>
      {/* Compact Header */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-center space-y-2">
            <h1 className="text-lg font-bold">{brandRider.title}</h1>
            <p className="text-sm text-muted-foreground line-clamp-2">{brandRider.tagline}</p>
            <Badge variant="outline" className="text-xs">
              {brandRider.format.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Voice & Tone - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Voice & Tone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {brandRider.voiceTone.slice(0, 4).map((tone, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tone}
              </Badge>
            ))}
            {brandRider.voiceTone.length > 4 && (
              <Badge variant="outline" className="text-xs">
                +{brandRider.voiceTone.length - 4}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Strengths - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            Strengths ({brandRider.strengths.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1">
            {brandRider.strengths.slice(0, 3).map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-xs">
                <div className="w-1 h-1 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="line-clamp-1">{strength}</span>
              </li>
            ))}
            {brandRider.strengths.length > 3 && (
              <li className="text-xs text-muted-foreground">+{brandRider.strengths.length - 3} more</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Color Palette - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="w-4 h-4 text-primary" />
            Colors ({brandRider.palette.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {brandRider.palette.slice(0, 5).map((color, index) => (
              <div key={index} className="flex flex-col items-center gap-1">
                <div 
                  className="w-6 h-6 rounded-lg border border-border"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
                <span className="text-xs font-mono">{color.hex.slice(1)}</span>
              </div>
            ))}
            {brandRider.palette.length > 5 && (
              <div className="flex items-center justify-center w-6 h-6 rounded-lg border border-dashed border-muted-foreground">
                <span className="text-xs">+{brandRider.palette.length - 5}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bio - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Bio</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed line-clamp-4">{brandRider.bio}</p>
        </CardContent>
      </Card>

      {/* Signature Phrases - Condensed */}
      {brandRider.signaturePhrases.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" />
              Phrases ({brandRider.signaturePhrases.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {brandRider.signaturePhrases.slice(0, 2).map((phrase, index) => (
                <p key={index} className="text-xs line-clamp-1 italic">"{phrase}"</p>
              ))}
              {brandRider.signaturePhrases.length > 2 && (
                <p className="text-xs text-muted-foreground">+{brandRider.signaturePhrases.length - 2} more</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Compact version for cards and previews
export function BrandRiderCard({ brandRider, className = '' }: { brandRider: BrandRider; className?: string }) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">{brandRider.title}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-1">{brandRider.tagline}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {brandRider.format.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini color palette */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Colors:</span>
          <div className="flex gap-1">
            {brandRider.palette.slice(0, 4).map((color, index) => (
              <div
                key={index}
                className="w-4 h-4 rounded-full border border-border"
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </div>

        {/* Key strengths preview */}
        <div>
          <span className="text-xs font-medium text-muted-foreground">Strengths:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {brandRider.strengths.slice(0, 3).map((strength, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {strength}
              </Badge>
            ))}
            {brandRider.strengths.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{brandRider.strengths.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Bio preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {brandRider.bio}
        </p>
      </CardContent>
    </Card>
  );
}

// Print-optimized version
export function BrandRiderPrintPreview({ brandRider, className = '' }: { brandRider: BrandRider; className?: string }) {
  return (
    <div className={`max-w-[8.5in] mx-auto bg-white text-black p-6 sm:p-8 space-y-4 sm:space-y-6 ${className}`} style={{ minHeight: '11in' }}>
      {/* Header */}
      <div className="text-center space-y-2 border-b-2 border-gray-300 pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{brandRider.title}</h1>
        <p className="text-base sm:text-lg font-semibold text-gray-700">Brand Guidelines</p>
        <p className="text-sm text-gray-600">{brandRider.format.toUpperCase()} Format</p>
      </div>

      {/* Tagline */}
      <div className="text-center">
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">TAGLINE</h2>
        <p className="text-sm sm:text-base font-semibold italic border-l-4 border-gray-400 pl-4 py-2">
          "{brandRider.tagline}"
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Voice & Tone */}
        <div>
          <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">VOICE & TONE</h2>
          <div className="flex flex-wrap gap-1 text-xs sm:text-sm">
            {brandRider.voiceTone.map((tone, index) => (
              <span key={index} className="px-2 py-1 bg-gray-200 rounded">
                {tone}
              </span>
            ))}
          </div>
        </div>

        {/* Key Strengths */}
        <div>
          <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">KEY STRENGTHS</h2>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
            {brandRider.strengths.map((strength, index) => (
              <li key={index}>{strength}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">COLOR PALETTE</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {brandRider.palette.map((color, index) => (
            <div key={index} className="text-center">
              <div 
                className="w-full h-12 sm:h-16 border border-gray-300 mb-1"
                style={{ backgroundColor: color.hex }}
              />
              <p className="text-xs font-semibold">{color.name}</p>
              <p className="text-xs font-mono text-gray-600">{color.hex.toUpperCase()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typography */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">TYPOGRAPHY</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">HEADING FONT</p>
            <div className="p-2 sm:p-3 bg-gray-100 border">
              <p className="font-bold text-sm sm:text-base" style={{ fontFamily: brandRider.fonts.heading }}>
                {brandRider.fonts.heading}
              </p>
              <p className="text-xs text-gray-600">Sample heading text</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">BODY FONT</p>
            <div className="p-2 sm:p-3 bg-gray-100 border">
              <p className="text-xs sm:text-sm" style={{ fontFamily: brandRider.fonts.body }}>
                {brandRider.fonts.body}
              </p>
              <p className="text-xs text-gray-600">Sample body text</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">PROFESSIONAL BIO</h2>
        <p className="text-xs sm:text-sm leading-relaxed bg-gray-50 p-3 sm:p-4 border-l-4 border-gray-400">
          {brandRider.bio}
        </p>
      </div>

      {/* Signature Phrases */}
      {brandRider.signaturePhrases.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">SIGNATURE PHRASES</h2>
          <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm">
            {brandRider.signaturePhrases.map((phrase, index) => (
              <li key={index} className="italic">"{phrase}"</li>
            ))}
          </ul>
        </div>
      )}

      {/* Usage Examples */}
      {brandRider.examples && brandRider.examples.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">USAGE EXAMPLES</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {brandRider.examples.map((example, index) => (
              <div key={index} className="border border-gray-300 p-2 sm:p-3">
                <p className="text-xs font-semibold text-gray-600 mb-1">{example.context.toUpperCase()}</p>
                <p className="text-xs sm:text-sm">{example.example}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}