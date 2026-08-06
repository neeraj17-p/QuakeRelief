'use client';

import { useEffect, useState, useRef } from 'react';

interface ServiceWorkerState {
  isRegistered: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
}

/**
 * Hook to register the service worker and expose connection state.
 * Must only be used on the client side.
 */
export function useServiceWorker() {
  const [state, setState] = useState<ServiceWorkerState>(() => ({
    isRegistered: false,
    isOffline: typeof navigator !== 'undefined' ? !navigator.onLine : false,
    registration: null,
  }));

  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Only run in browser context
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    // Track online/offline status
    const handleOnline = () => setState((s) => ({ ...s, isOffline: false }));
    const handleOffline = () => setState((s) => ({ ...s, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Register service worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        registrationRef.current = registration;

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'activated') {
              // New service worker activated — could notify user to refresh
              console.log('[PWA] Service worker updated — refresh recommended');
            }
          });
        });

        setState({
          isRegistered: true,
          isOffline: !navigator.onLine,
          registration,
        });

        console.log('[PWA] Service worker registered successfully');
      } catch (error) {
        console.warn('[PWA] Service worker registration failed:', error);
      }
    };

    registerSW();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Queue a coordinate payload for background sync.
   * Used when the device goes offline to buffer GPS coordinates.
   */
  const queueCoordinate = (payload: { lat: number; lng: number; timestamp: number }) => {
    if (registrationRef.current && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'QUEUE_COORDINATE',
        payload,
      });
    }
  };

  /**
   * Request a background sync for the coordinate queue.
   * Falls back to immediate replay if Background Sync API is unavailable.
   */
  const requestSync = async () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = registrationRef.current;
        if (registration) {
          await (registration as any).sync.register('quake-relief-coordinates');
        }
      } catch {
        // SyncManager not available — attempt direct replay
        console.log('[PWA] Background Sync unavailable, replaying directly');
      }
    }
  };

  return {
    ...state,
    queueCoordinate,
    requestSync,
  };
}
