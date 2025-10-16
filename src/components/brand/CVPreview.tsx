import { CV, Role, Link } from '@/lib/generators/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Briefcase, 
  Award, 
  ExternalLink, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Building
} from 'lucide-react';

interface CVPreviewProps {
  cv: CV;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
}

export function CVPreview({ 
  cv, 
  className = '', 
  showHeader = true,
  compact = false 
}: CVPreviewProps) {
  return (
    <div className={`max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-6 ${className}`}>
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-4 sm:pt-6">
          <div className="text-center space-y-3 sm:space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">{cv.name}</h1>
              <p className="text-lg sm:text-xl text-primary font-semibold">{cv.role}</p>
              {showHeader && (
                <Badge variant="outline" className="text-xs sm:text-sm mt-2">
                  {cv.format.toUpperCase()} Format
                </Badge>
              )}
            </div>
            
            {/* Contact Links */}
            {cv.links && cv.links.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2">
                {cv.links.map((link, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
                    asChild
                  >
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate max-w-[100px] sm:max-w-none">{link.label}</span>
                    </a>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <User className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base leading-relaxed">{cv.summary}</p>
        </CardContent>
      </Card>

      <div className={`grid gap-4 sm:gap-6 ${compact ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'}`}>
        {/* Professional Experience */}
        <Card className={compact ? '' : 'lg:col-span-2'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Professional Experience
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 sm:space-y-6">
              {cv.experience.map((role, index) => (
                <div key={index} className="relative">
                  {/* Timeline indicator - hidden on mobile for cleaner look */}
                  {!compact && index < cv.experience.length - 1 && (
                    <div className="absolute left-0 top-12 w-px h-full bg-border hidden sm:block" />
                  )}
                  
                  <div className="flex gap-3 sm:gap-4">
                    {!compact && (
                      <div className="flex-shrink-0 hidden sm:block">
                        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-primary mt-2" />
                      </div>
                    )}
                    
                    <div className="flex-1 space-y-2 sm:space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-base sm:text-lg leading-tight">{role.role}</h3>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1">
                            <Building className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                            <span className="font-medium text-sm sm:text-base">{role.org}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground flex-shrink-0">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{role.dates}</span>
                        </div>
                      </div>
                      
                      <ul className="space-y-1.5 sm:space-y-2 ml-0 sm:ml-4">
                        {role.bullets.map((bullet, bulletIndex) => (
                          <li key={bulletIndex} className="flex items-start gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  {index < cv.experience.length - 1 && <Separator className="mt-4 sm:mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core Competencies */}
        <Card className={compact ? '' : 'lg:col-span-1'}>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              Core Competencies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {cv.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs sm:text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      {!compact && (
        <div className="text-center pt-6 border-t">
          <p className="text-xs text-muted-foreground">
            Generated with {cv.format.toUpperCase()} format • 
            {cv.createdAt && ` Created ${new Date(cv.createdAt).toLocaleDateString()}`}
          </p>
        </div>
      )}
    </div>
  );
}

// Compact version for cards and previews
export function CVCard({ cv, className = '' }: { cv: CV; className?: string }) {
  return (
    <Card className={`hover:shadow-md transition-shadow ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg line-clamp-1">{cv.name}</CardTitle>
            <p className="text-sm text-primary font-medium line-clamp-1">{cv.role}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {cv.format.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary preview */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {cv.summary}
        </p>

        {/* Experience count */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Briefcase className="w-3 h-3" />
            <span>{cv.experience.length} roles</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>{cv.skills.length} skills</span>
          </div>
          {cv.links && cv.links.length > 0 && (
            <div className="flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              <span>{cv.links.length} links</span>
            </div>
          )}
        </div>

        {/* Top skills preview */}
        <div>
          <span className="text-xs font-medium text-muted-foreground">Top Skills:</span>
          <div className="flex flex-wrap gap-1 mt-1">
            {cv.skills.slice(0, 3).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {cv.skills.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{cv.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Recent experience */}
        {cv.experience.length > 0 && (
          <div>
            <span className="text-xs font-medium text-muted-foreground">Latest Role:</span>
            <div className="mt-1">
              <p className="text-sm font-medium line-clamp-1">{cv.experience[0].role}</p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {cv.experience[0].org} • {cv.experience[0].dates}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Print-optimized version
export function CVPrintPreview({ cv, className = '' }: { cv: CV; className?: string }) {
  return (
    <div className={`max-w-[8.5in] mx-auto bg-white text-black p-6 sm:p-8 space-y-4 sm:space-y-6 ${className}`} style={{ minHeight: '11in' }}>
      {/* Header */}
      <div className="text-center space-y-2 border-b-2 border-gray-300 pb-3 sm:pb-4">
        <h1 className="text-xl sm:text-2xl font-bold">{cv.name}</h1>
        <p className="text-base sm:text-lg font-semibold text-gray-700">{cv.role}</p>
        {cv.links && cv.links.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs sm:text-sm">
            {cv.links.map((link, index) => (
              <span key={index} className="break-all">
                {link.label}: {link.url}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">PROFESSIONAL SUMMARY</h2>
        <p className="text-xs sm:text-sm leading-relaxed">{cv.summary}</p>
      </div>

      {/* Experience */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 sm:mb-3 text-gray-800">PROFESSIONAL EXPERIENCE</h2>
        <div className="space-y-3 sm:space-y-4">
          {cv.experience.map((role, index) => (
            <div key={index}>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-1 sm:mb-2">
                <div className="flex-1">
                  <h3 className="font-bold text-sm sm:text-base">{role.role}</h3>
                  <p className="font-semibold text-gray-700 text-xs sm:text-sm">{role.org}</p>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mt-1 sm:mt-0">{role.dates}</p>
              </div>
              <ul className="list-disc list-inside space-y-0.5 sm:space-y-1 text-xs sm:text-sm ml-2 sm:ml-4">
                {role.bullets.map((bullet, bulletIndex) => (
                  <li key={bulletIndex} className="leading-relaxed">{bullet}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div>
        <h2 className="text-base sm:text-lg font-bold mb-2 text-gray-800">CORE COMPETENCIES</h2>
        <p className="text-xs sm:text-sm leading-relaxed">{cv.skills.join(' • ')}</p>
      </div>
    </div>
  );
}

// Mobile-optimized preview for small screens
export function CVMobilePreview({ cv, className = '' }: { cv: CV; className?: string }) {
  return (
    <div className={`w-full max-w-sm mx-auto space-y-4 p-4 ${className}`}>
      {/* Compact Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="text-center space-y-2">
            <h1 className="text-lg font-bold">{cv.name}</h1>
            <p className="text-sm text-primary font-semibold">{cv.role}</p>
            <Badge variant="outline" className="text-xs">
              {cv.format.toUpperCase()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs leading-relaxed line-clamp-3">{cv.summary}</p>
        </CardContent>
      </Card>

      {/* Experience - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Experience ({cv.experience.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {cv.experience.slice(0, 2).map((role, index) => (
              <div key={index} className="space-y-1">
                <div>
                  <h3 className="font-semibold text-xs">{role.role}</h3>
                  <p className="text-xs text-muted-foreground">{role.org} • {role.dates}</p>
                </div>
                <p className="text-xs line-clamp-2">{role.bullets[0]}</p>
              </div>
            ))}
            {cv.experience.length > 2 && (
              <p className="text-xs text-muted-foreground">+{cv.experience.length - 2} more roles</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Skills - Condensed */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Skills ({cv.skills.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {cv.skills.slice(0, 6).map((skill, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {cv.skills.length > 6 && (
              <Badge variant="outline" className="text-xs">
                +{cv.skills.length - 6}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      {cv.links && cv.links.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-primary" />
              Links
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {cv.links.map((link, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs p-1 justify-start w-full"
                  asChild
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    <span className="truncate">{link.label}</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}