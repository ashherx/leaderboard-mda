"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type LeaderboardNavigationContextValue = {
  startNavigation: () => void;
};

const LeaderboardNavigationContext = createContext<LeaderboardNavigationContextValue | null>(null);

/**
 * Keeps the current leaderboard on screen while App Router fetches the next
 * state/category page. The route key only changes after the incoming page has
 * committed, which is exactly when the overlay should go away.
 */
export function LeaderboardNavigationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback(() => setIsNavigating(true), []);
  const value = useMemo(() => ({ startNavigation }), [startNavigation]);

  return (
    <LeaderboardNavigationContext.Provider value={value}>
      {children}
      {isNavigating && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/35 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
          aria-label="Loading leaderboard"
        >
          <div className="flex items-center gap-3">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" aria-hidden="true" />
            <span className="font-display text-sm font-semibold text-ink">Loading...</span>
          </div>
        </div>
      )}
    </LeaderboardNavigationContext.Provider>
  );
}

export function useLeaderboardNavigation() {
  const context = useContext(LeaderboardNavigationContext);
  if (!context) throw new Error("useLeaderboardNavigation must be used within LeaderboardNavigationProvider.");
  return context;
}
