// Service Worker registration and management
export class ServiceWorkerManager {
  private static instance: ServiceWorkerManager;
  private registration: ServiceWorkerRegistration | null = null;

  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager.instance) {
      ServiceWorkerManager.instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager.instance;
  }

  // Register service worker
  async register(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return;
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered successfully');

      // Handle updates
      this.registration.addEventListener('updatefound', () => {
        const newWorker = this.registration?.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New content is available, notify user
              this.notifyUpdate();
            }
          });
        }
      });

    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  // Unregister service worker
  async unregister(): Promise<void> {
    if (this.registration) {
      await this.registration.unregister();
      console.log('Service Worker unregistered');
    }
  }

  // Update service worker
  async update(): Promise<void> {
    if (this.registration) {
      await this.registration.update();
    }
  }

  // Skip waiting and activate new service worker
  skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // Notify user about updates
  private notifyUpdate(): void {
    // You can integrate this with your notification system
    console.log('New version available! Please refresh the page.');
    
    // Optional: Show a toast notification
    if (window.dispatchEvent) {
      window.dispatchEvent(new CustomEvent('sw-update-available'));
    }
  }

  // Clear all caches
  async clearCaches(): Promise<void> {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
      console.log('All caches cleared');
    }
  }

  // Get cache usage
  async getCacheUsage(): Promise<{ quota: number; usage: number }> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        quota: estimate.quota || 0,
        usage: estimate.usage || 0,
      };
    }
    return { quota: 0, usage: 0 };
  }
}

// Initialize service worker in production
export function initializeServiceWorker(): void {
  if (process.env.NODE_ENV === 'production') {
    const swManager = ServiceWorkerManager.getInstance();
    swManager.register();

    // Listen for update notifications
    window.addEventListener('sw-update-available', () => {
      // You can show a toast or modal here
      console.log('App update available!');
    });
  }
}

// Hook for service worker status
export function useServiceWorker() {
  const swManager = ServiceWorkerManager.getInstance();

  return {
    update: () => swManager.update(),
    skipWaiting: () => swManager.skipWaiting(),
    clearCaches: () => swManager.clearCaches(),
    getCacheUsage: () => swManager.getCacheUsage(),
  };
}