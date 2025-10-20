import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface RobustImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackSrc?: string;
  className?: string;
  onLoadError?: () => void;
}

export const RobustImage: React.FC<RobustImageProps> = ({
  src,
  alt,
  fallbackSrc,
  className,
  onLoadError,
  ...props
}) => {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setIsLoading(true);
    setHasError(false);
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    
    if (currentSrc !== fallbackSrc && fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      return;
    }
    
    onLoadError?.();
  };

  if (hasError && !fallbackSrc) {
    return (
      <div className={cn(
        "flex items-center justify-center bg-muted text-muted-foreground text-sm",
        className
      )}>
        <div className="text-center p-4">
          <div className="mb-2">🖼️</div>
          <div>Image not available</div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted animate-pulse">
          <div className="text-muted-foreground text-sm">Loading...</div>
        </div>
      )}
      <img
        {...props}
        src={currentSrc}
        alt={alt}
        className={cn(
          "transition-opacity duration-300",
          isLoading ? "opacity-0" : "opacity-100",
          className
        )}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
        decoding="async"
      />
    </div>
  );
};