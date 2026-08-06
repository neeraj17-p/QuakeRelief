'use client';

import { useEffect, useRef } from 'react';
import { useServiceWorker } from '@/hooks/use-service-worker';

/**
 * PWA Register component — renders nothing visible.
 * Registers the service worker on mount and exposes offline status
 * to the rest of the app via a ref callback.
 */
export function PWARegister() {
  const { isRegistered, isOffline, registration } = useServiceWorker();
  const isRegisteredRef = useRef(isRegistered);
  const isOfflineRef = useRef(isOffline);
  const registrationRef = useRef(registration);

  // Keep refs in sync so other components can poll
  useEffect(() => {
    isRegisteredRef.current = isRegistered;
  }, [isRegistered]);

  useEffect(() => {
    isOfflineRef.current = isOffline;
  }, [isOffline]);

  useEffect(() => {
    registrationRef.current = registration;
  }, [registration]);

  // Expose PWA state on window for global access
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__PWA_STATE__ = {
      get isRegistered() {
        return isRegisteredRef.current;
      },
      get isOffline() {
        return isOfflineRef.current;
      },
      get registration() {
        return registrationRef.current;
      },
    };
  }, []);

  // Silence unused variable warnings — this component has side effects only
  void isRegisteredRef;
  void isOfflineRef;
  void registrationRef;

  return null;
}
