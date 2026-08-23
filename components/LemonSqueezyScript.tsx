"use client";

import Script from "next/script";

declare global {
  interface Window {
    createLemonSqueezy?: () => void;
    LemonSqueezy?: { Url: { Open: (url: string) => void } };
  }
}

/**
 * Loads Lemon.js once for the whole app - unlike Paddle.js (initialized
 * on-demand per checkout via initializePaddle), Lemon Squeezy's overlay is a
 * plain script tag that self-registers window.LemonSqueezy. Per Lemon
 * Squeezy's own guidance for framework apps, window.createLemonSqueezy() is
 * called explicitly on load rather than relied on to run automatically,
 * since the script can finish loading before/after this component mounts.
 */
export function LemonSqueezyScript() {
  return (
    <Script
      src="https://app.lemonsqueezy.com/js/lemon.js"
      strategy="afterInteractive"
      onLoad={() => window.createLemonSqueezy?.()}
    />
  );
}
