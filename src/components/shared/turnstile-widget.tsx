'use client';

import * as React from 'react';
import Script from 'next/script';

type TurnstileWidgetId = string;

interface TurnstileApi {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      action: string;
      theme?: 'light' | 'dark' | 'auto';
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    }
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove?: (widgetId: TurnstileWidgetId) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

interface TurnstileWidgetProps {
  action: string;
  onTokenChange: (token: string) => void;
  resetSignal?: number;
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export const isTurnstileClientEnabled = Boolean(SITE_KEY);

export function TurnstileWidget({
  action,
  onTokenChange,
  resetSignal = 0,
}: TurnstileWidgetProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const widgetIdRef = React.useRef<TurnstileWidgetId | null>(null);
  const onTokenChangeRef = React.useRef(onTokenChange);
  React.useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  const renderWidget = React.useCallback(() => {
    if (!SITE_KEY || !containerRef.current || !window.turnstile) return;
    if (widgetIdRef.current !== null) return;

    widgetIdRef.current = window.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      action,
      theme: 'light',
      callback: (token: string) => onTokenChangeRef.current(token),
      'expired-callback': () => onTokenChangeRef.current(''),
      'error-callback': () => onTokenChangeRef.current(''),
    });
  }, [action]);

  React.useEffect(() => {
    if (!SITE_KEY) return;
    if (window.turnstile) {
      renderWidget();
    }
    return () => {
      if (widgetIdRef.current !== null) {
        window.turnstile?.remove?.(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [renderWidget]);

  React.useEffect(() => {
    if (resetSignal > 0 && widgetIdRef.current !== null && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChangeRef.current('');
    }
  }, [resetSignal]);

  if (!SITE_KEY) {
    return null;
  }

  return (
    <div className="space-y-1">
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={renderWidget}
      />
      <div ref={containerRef} className="min-h-[65px]" />
    </div>
  );
}

