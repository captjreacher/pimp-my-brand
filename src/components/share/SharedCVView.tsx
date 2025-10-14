import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink } from 'lucide-react';
import type { CV } from '@/lib/generators/types';
import type { SharedContent } from '@/lib/export/share-manager';

interface SharedCVViewProps {
  sharedContent: SharedContent & { content: CV };
}

export function SharedCVView({ sharedContent }: SharedCVViewProps) {
  const { content: cv, owner } = sharedContent;

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
              <h1 className="text-3xl font-bold">{cv.name}</h1>
              <h2 className="text-xl text-muted-foreground">{cv.role}</h2>
              <p className="text-sm text-muted-foreground">
                Shared by {owner.displayName || owner.handle || 'Anonymous'}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      {cv.summary && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="leading-relaxed text-lg">{cv.summary}</p>
          </CardContent>
        </Card>
      )}

      {/* Experience */}
      {cv.experience.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Experience</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cv.experience.map((role, index) => (
                <div key={index} className="relative">
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="text-xl font-semibold">{role.role}</h3>
                      <Badge variant="outline" className="w-fit">
                        {role.dates}
                      </Badge>
                    </div>
                    <p className="text-lg text-muted-foreground font-medium">
                      {role.org}
                    </p>
                    <ul className="space-y-2 mt-4">
                      {role.bullets.map((bullet, bulletIndex) => (
                        <li key={bulletIndex} className="flex items-start gap-3">
                          <span className="text-primary mt-2 text-xs">●</span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills */}
      {cv.skills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {cv.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {cv.links.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-4">
              {cv.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{link.label}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {link.url}
                    </p>
                  </div>
                </a>
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