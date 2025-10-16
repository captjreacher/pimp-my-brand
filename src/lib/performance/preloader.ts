// Preload critical resources
export class ResourcePreloader {
  private preloadedResources = new Set<string>();

  // Preload critical CSS
  preloadCSS(href: string): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = href;
    link.onload = () => {
      link.rel = 'stylesheet';
    };
    document.head.appendChild(link);
    
    this.preloadedResources.add(href);
  }

  // Preload JavaScript modules
  preloadJS(href: string): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'modulepreload';
    link.href = href;
    document.head.appendChild(link);
    
    this.preloadedResources.add(href);
  }

  // Preload images
  preloadImage(src: string): Promise<void> {
    if (this.preloadedResources.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.preloadedResources.add(src);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Preload fonts
  preloadFont(href: string, type = 'font/woff2'): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = type;
    link.href = href;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    
    this.preloadedResources.add(href);
  }

  // Prefetch resources for future navigation
  prefetchResource(href: string): void {
    if (this.preloadedResources.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
    
    this.preloadedResources.add(href);
  }

  // Preload critical Google Fonts
  preloadGoogleFonts(families: string[]): void {
    families.forEach(family => {
      const href = `https://fonts.googleapis.com/css2?family=${family.replace(' ', '+')}:wght@400;500;600;700&display=swap`;
      this.preloadCSS(href);
    });
  }
}

// Global preloader instance
export const preloader = new ResourcePreloader();

// Preload critical resources on app start
export function preloadCriticalResources(): void {
  // Preload common Google Fonts used in the app
  preloader.preloadGoogleFonts([
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat'
  ]);

  // Preload critical images
  const criticalImages = [
    '/placeholder.svg',
    '/favicon.ico'
  ];

  criticalImages.forEach(src => {
    preloader.preloadImage(src).catch(() => {
      // Silently fail for missing images
    });
  });
}