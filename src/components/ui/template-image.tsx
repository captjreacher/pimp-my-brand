import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { getTemplateImage, type TemplateImage } from '@/lib/images/template-images';

interface TemplateImageProps {
  format: string;
  category: 'avatar' | 'background' | 'logo' | 'accent';
  userImage?: string;
  usePersonalized?: boolean;
  className?: string;
  alt?: string;
  fallbackClassName?: string;
  showPlaceholder?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function TemplateImage({
  format,
  category,
  userImage,
  usePersonalized = false,
  className,
  alt,
  fallbackClassName,
  showPlaceholder = true,
  onLoad,
  onError
}: TemplateImageProps) {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentImage, setCurrentImage] = useState<TemplateImage | null>(null);

  useEffect(() => {
    const image = getTemplateImage(format, category, userImage, usePersonalized);
    setCurrentImage(image);
    setImageState('loading');
  }, [format, category, userImage, usePersonalized]);

  const handleLoad = () => {
    setImageState('loaded');
    onLoad?.();
  };

  const handleError = () => {
    setImageState('error');
    onError?.();
    
    // Try fallback image if current image fails
    if (currentImage && !userImage) {
      const fallbackImage = getTemplateImage(format, category, undefined, false);
      if (fallbackImage.url !== currentImage.url) {
        setCurrentImage(fallbackImage);
        setImageState('loading');
      }
    }
  };

  if (!currentImage) {
    return showPlaceholder ? (
      <div className={cn(
        "bg-muted animate-pulse flex items-center justify-center",
        className,
        fallbackClassName
      )}>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    ) : null;
  }

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {imageState === 'loading' && showPlaceholder && (
        <div className={cn(
          "absolute inset-0 bg-muted animate-pulse flex items-center justify-center",
          fallbackClassName
        )}>
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
      
      <img
        src={currentImage.url}
        alt={alt || currentImage.alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
      
      {imageState === 'error' && showPlaceholder && (
        <div className={cn(
          "absolute inset-0 bg-muted flex items-center justify-center",
          fallbackClassName
        )}>
          <div className="text-muted-foreground text-sm">Image unavailable</div>
        </div>
      )}
    </div>
  );
}

// Specialized components for common use cases
export function AvatarImage({
  format,
  userAvatar,
  className,
  alt = "Profile avatar",
  ...props
}: Omit<TemplateImageProps, 'category'> & { userAvatar?: string }) {
  return (
    <TemplateImage
      format={format}
      category="avatar"
      userImage={userAvatar}
      className={cn("rounded-full aspect-square", className)}
      alt={alt}
      {...props}
    />
  );
}

export function BackgroundImage({
  format,
  userBackground,
  className,
  alt = "Background image",
  ...props
}: Omit<TemplateImageProps, 'category'> & { userBackground?: string }) {
  return (
    <TemplateImage
      format={format}
      category="background"
      userImage={userBackground}
      className={cn("w-full h-full", className)}
      alt={alt}
      {...props}
    />
  );
}

export function LogoImage({
  format,
  userLogo,
  className,
  alt = "Brand logo",
  ...props
}: Omit<TemplateImageProps, 'category'> & { userLogo?: string }) {
  return (
    <TemplateImage
      format={format}
      category="logo"
      userImage={userLogo}
      className={cn("max-h-12 w-auto", className)}
      alt={alt}
      {...props}
    />
  );
}