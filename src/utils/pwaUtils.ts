// PWA Utilities for WRFCoin Platform
import React from 'react';
import { createLogger } from './logger';

const log = createLogger('pwa');

export interface PWAInstallPrompt {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface CacheStatus {
  [cacheName: string]: number;
}

export interface OfflineQueue {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
  timestamp: number;
  retryCount: number;
}

class PWAManager {
  private deferredPrompt: PWAInstallPrompt | null = null;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private isOnline: boolean = navigator.onLine;
  private offlineQueue: OfflineQueue[] = [];
  private onlineListeners: Set<() => void> = new Set();
  private offlineListeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      this.deferredPrompt = e as any;
      this.notifyInstallAvailable();
    });

    // Listen for app installed
    window.addEventListener('appinstalled', () => {
      log.info('PWA installed successfully');
      this.deferredPrompt = null;
    });

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onlineListeners.forEach(listener => listener());
      this.processOfflineQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.offlineListeners.forEach(listener => listener());
    });

    // Register service worker
    this.registerServiceWorker();

    // Load offline queue from localStorage
    this.loadOfflineQueue();
  }

  // Service Worker Management
  async registerServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        this.swRegistration = registration;

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New service worker is available
                this.notifyUpdateAvailable();
              }
            });
          }
        });

        log.info('Service Worker registered successfully');
        return true;
      } catch (error) {
        log.error('Service Worker registration failed:', error);
        return false;
      }
    }
    return false;
  }

  async updateServiceWorker(): Promise<boolean> {
    if (this.swRegistration) {
      try {
        await this.swRegistration.update();
        return true;
      } catch (error) {
        log.error('Service Worker update failed:', error);
        return false;
      }
    }
    return false;
  }

  skipWaiting(): void {
    if (this.swRegistration && this.swRegistration.waiting) {
      this.swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  // PWA Installation
  async installPWA(): Promise<boolean> {
    if (this.deferredPrompt) {
      try {
        await this.deferredPrompt.prompt();
        const choiceResult = await this.deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
          log.info('User accepted PWA installation');
          this.deferredPrompt = null;
          return true;
        } else {
          log.info('User dismissed PWA installation');
          return false;
        }
      } catch (error) {
        log.error('PWA installation failed:', error);
        return false;
      }
    }
    return false;
  }

  canInstall(): boolean {
    return this.deferredPrompt !== null;
  }

  isInstalled(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    );
  }

  // Push Notifications
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    return 'denied';
  }

  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (this.swRegistration && 'PushManager' in window) {
      try {
        const subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(
            (import.meta as any).env.VITE_VAPID_PUBLIC_KEY || '',
          ) as BufferSource,
        });

        // Send subscription to server
        await this.sendSubscriptionToServer(subscription);
        return subscription;
      } catch (error) {
        log.error('Push subscription failed:', error);
        return null;
      }
    }
    return null;
  }

  async showNotification(payload: NotificationPayload): Promise<void> {
    if (this.swRegistration && Notification.permission === 'granted') {
      const options: NotificationOptions & { vibrate?: number[] } = {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        data: payload.data,
        requireInteraction: payload.requireInteraction,
        silent: payload.silent,
        vibrate: payload.vibrate || [200, 100, 200],
        tag: payload.tag || 'wrfcoin-notification',
      };

      // Add actions if supported (only in service worker context)
      if (payload.actions && typeof Notification !== 'undefined') {
        (options as any).actions = payload.actions;
      }

      await this.swRegistration.showNotification(payload.title, options);
    }
  }

  // Cache Management
  async getCacheStatus(): Promise<CacheStatus> {
    return new Promise((resolve, reject) => {
      if (this.swRegistration && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel();

        messageChannel.port1.onmessage = event => {
          if (event.data.type === 'CACHE_STATUS') {
            resolve(event.data.status);
          } else if (event.data.type === 'CACHE_STATUS_ERROR') {
            reject(new Error(event.data.error));
          }
        };

        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2],
        );
      } else {
        resolve({});
      }
    });
  }

  async refreshCache(urls: string[] = []): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_REFRESH',
        urls,
      });
    }
  }

  async clearCache(cacheNames: string[] = []): Promise<void> {
    if (navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CLEAR_CACHE',
        cacheNames,
      });
    }
  }

  // Offline Queue Management
  addToOfflineQueue(
    request: Omit<OfflineQueue, 'id' | 'timestamp' | 'retryCount'>,
  ): void {
    const queueItem: OfflineQueue = {
      ...request,
      id: this.generateId(),
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.offlineQueue.push(queueItem);
    this.saveOfflineQueue();
  }

  private async processOfflineQueue(): Promise<void> {
    if (this.offlineQueue.length === 0) return;

    const queue = [...this.offlineQueue];
    this.offlineQueue = [];

    for (const item of queue) {
      try {
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        });

        if (response.ok) {
          log.info('Offline queue item processed:', item.id);
        } else {
          // Retry logic
          if (item.retryCount < 3) {
            this.offlineQueue.push({
              ...item,
              retryCount: item.retryCount + 1,
            });
          } else {
            log.error('Offline queue item failed after retries:', item.id);
          }
        }
      } catch (error) {
        // Add back to queue for retry
        if (item.retryCount < 3) {
          this.offlineQueue.push({
            ...item,
            retryCount: item.retryCount + 1,
          });
        } else {
          log.error(
            'Offline queue item failed after retries:',
            item.id,
            error,
          );
        }
      }
    }

    this.saveOfflineQueue();
  }

  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('wrfcoin-offline-queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
      }
    } catch (error) {
      log.warn('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  private saveOfflineQueue(): void {
    try {
      localStorage.setItem(
        'wrfcoin-offline-queue',
        JSON.stringify(this.offlineQueue),
      );
    } catch (error) {
      log.warn('Failed to save offline queue:', error);
    }
  }

  // Network Status
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  onOnline(callback: () => void): () => void {
    this.onlineListeners.add(callback);
    return () => this.onlineListeners.delete(callback);
  }

  onOffline(callback: () => void): () => void {
    this.offlineListeners.add(callback);
    return () => this.offlineListeners.delete(callback);
  }

  // Device Features
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    if ('wakeLock' in navigator) {
      try {
        return await (navigator as any).wakeLock.request('screen');
      } catch (error) {
        log.warn('Wake lock request failed:', error);
        return null;
      }
    }
    return null;
  }

  vibrate(pattern: number | number[]): boolean {
    if ('vibrate' in navigator) {
      return navigator.vibrate(pattern);
    }
    return false;
  }

  async shareData(data: ShareData): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share(data);
        return true;
      } catch (error) {
        log.warn('Share failed:', error);
        return false;
      }
    }
    return false;
  }

  // Utility Methods
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    return new Uint8Array([...rawData].map(char => char.charCodeAt(0)));
  }

  private async sendSubscriptionToServer(
    subscription: PushSubscription,
  ): Promise<void> {
    try {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });
    } catch (error) {
      log.error('Failed to send subscription to server:', error);
    }
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private notifyInstallAvailable(): void {
    // Dispatch custom event for install prompt
    window.dispatchEvent(new CustomEvent('pwa-install-available'));
  }

  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update available
    window.dispatchEvent(new CustomEvent('pwa-update-available'));
  }
}

// Singleton instance
export const pwaManager = new PWAManager();

// React Hook for PWA features
export const usePWA = () => {
  const [canInstall, setCanInstall] = React.useState(pwaManager.canInstall());
  const [isInstalled, setIsInstalled] = React.useState(
    pwaManager.isInstalled(),
  );
  const [isOnline, setIsOnline] = React.useState(pwaManager.isOnlineStatus());

  React.useEffect(() => {
    const handleInstallAvailable = () => setCanInstall(true);
    const handleUpdateAvailable = () => {
      // Show update notification
      log.info('PWA update available');
    };

    const unsubscribeOnline = pwaManager.onOnline(() => setIsOnline(true));
    const unsubscribeOffline = pwaManager.onOffline(() => setIsOnline(false));

    window.addEventListener('pwa-install-available', handleInstallAvailable);
    window.addEventListener('pwa-update-available', handleUpdateAvailable);

    return () => {
      window.removeEventListener(
        'pwa-install-available',
        handleInstallAvailable,
      );
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const install = async () => {
    const success = await pwaManager.installPWA();
    if (success) {
      setCanInstall(false);
      setIsInstalled(true);
    }
    return success;
  };

  const requestNotifications = () => pwaManager.requestNotificationPermission();
  const subscribeToPush = () => pwaManager.subscribeToPushNotifications();
  const showNotification = (payload: NotificationPayload) =>
    pwaManager.showNotification(payload);

  return {
    canInstall,
    isInstalled,
    isOnline,
    install,
    requestNotifications,
    subscribeToPush,
    showNotification,
    vibrate: pwaManager.vibrate.bind(pwaManager),
    share: pwaManager.shareData.bind(pwaManager),
    addToOfflineQueue: pwaManager.addToOfflineQueue.bind(pwaManager),
  };
};

export default pwaManager;
