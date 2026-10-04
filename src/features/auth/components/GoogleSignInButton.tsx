import { useCallback, useEffect, useRef } from 'react';
import { GOOGLE_CLIENT_ID } from '../utils/google';

type GoogleButtonText = 'signin_with' | 'signup_with' | 'continue_with';

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: GoogleButtonText;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleAccountsId } };
  }
}

let gisPromise: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.gsi = 'true';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
      document.head.appendChild(script);
    });
  }

  return gisPromise;
}

export const GoogleSignInButton = ({ onCredential, text = 'continue_with' }: GoogleSignInButtonProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  const render = useCallback(() => {
    const container = containerRef.current;
    const gsi = window.google?.accounts?.id;
    if (!container || !gsi || !GOOGLE_CLIENT_ID) return;

    const width = Math.max(200, Math.min(400, Math.round(container.clientWidth || 384)));

    gsi.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => {
        if (response?.credential) callbackRef.current(response.credential);
      },
    });

    container.innerHTML = '';
    gsi.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text,
      logo_alignment: 'center',
      width,
    });
  }, [text]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    loadGoogleIdentityServices()
      .then(() => {
        if (!cancelled) render();
      })
      .catch(() => {});

    const onResize = () => render();
    window.addEventListener('resize', onResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', onResize);
    };
  }, [render]);

  if (!GOOGLE_CLIENT_ID) return null;

  return <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />;
};
