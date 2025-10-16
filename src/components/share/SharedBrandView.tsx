import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { BrandRider } from '@/lib/generators/types';
import type { SharedContent } from '@/lib/export/share-manager';

interface SharedBrandViewProps {
  sharedContent: SharedContent & { content: BrandRider };
}

export function SharedBrandView({ sharedContent }: SharedBrandViewProps) {
  const { content: brand, owner } = sharedContent;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header with owner info */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={owner.avatarUrl} alt={owner.displayName} />
              <AvatarFallback>
                {owner.displayName?.charAt(0) || owner.handle?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{brand.title}</h1>
              <p className="text-muted-foreground">
                Shared by {owner.displayName || owner.handle || 'Anonymous'}
              </p>
            </div>
          </div>
          {brand.tagline && (
            <p className="text-lg text-muted-foreground italic mt-2">
              {brand.tagline}
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Voice & Tone */}
      {brand.voiceTone.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Voice & Tone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brand.voiceTone.map((tone, index) => (
                <Badge key={index} variant="secondary">
                  {tone}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Signature Phrases */}
      {brand.signaturePhrases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Signature Phrases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {brand.signaturePhrases.map((phrase, index) => (
                <blockquote key={index} className="border-l-4 border-primary pl-4 italic">
                  "{phrase}"
                </blockquote>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Strengths */}
        {brand.strengths.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Strengths</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {brand.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-green-500 mt-1">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Areas for Growth */}
        {brand.weaknesses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Areas for Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {brand.weaknesses.map((weakness, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-1">→</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Color Palette */}
      {brand.palette.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {brand.palette.map((color, index) => (
                <div key={index} className="text-center">
                  <div
                    className="w-full h-16 rounded-lg border shadow-sm mb-2"
                    style={{ backgroundColor: color.hex }}
                  />
                  <p className="text-sm font-medium">{color.name}</p>
                  <p className="text-xs text-muted-foreground">{color.hex}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Typography</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Heading Font</h3>
              <div
                className="p-4 border rounded-lg"
                style={{ fontFamily: brand.fonts.heading }}
              >
                <p className="text-2xl font-bold">
                  {brand.fonts.heading}
                </p>
                <p className="text-sm text-muted-foreground">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Body Font</h3>
              <div
                className="p-4 border rounded-lg"
                style={{ fontFamily: brand.fonts.body }}
              >
                <p className="text-lg">
                  {brand.fonts.body}
                </p>
                <p className="text-sm text-muted-foreground">
                  The quick brown fox jumps over the lazy dog
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bio */}
      {brand.bio && (
        <Card>
          <CardHeader>
            <CardTitle>Bio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed">{brand.bio}</p>
          </CardContent>
        </Card>
      )}

      {/* Usage Examples */}
      {brand.examples && brand.examples.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {brand.examples.map((example, index) => (
                <div key={index} className="border-l-4 border-primary pl-4">
                  <h4 className="font-semibold text-sm text-muted-foreground mb-1">
                    {example.context}
                  </h4>
                  <blockquote className="italic">
                    "{example.text}"
                  </blockquote>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <div className="text-center py-6">
        <Separator className="mb-4" />
        <p className="text-sm text-muted-foreground">
          Shared on {sharedContent.createdAt.toLocaleDateString()}
          {sharedContent.expiresAt && (
            <span> • Expires {sharedContent.expiresAt.toLocaleDateString()}</span>
          )}
        </p>
      </div>
    </div>
  );
}