"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5000;

/** Live "N online" indicator — starts from the server-rendered count, then polls every 5s. */
export function OnlineBadge({ initialOnline }: { initialOnline: number }) {
  const [online, setOnline] = useState(initialOnline);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const response = await fetch("/api/online-visitors", { cache: "no-store" });
        if (!response.ok) return;
        const { online } = (await response.json()) as { online: number };
        if (!cancelled) setOnline(online);
      } catch {
        // Transient network hiccup — keep showing the last known count.
      }
    }

    const id = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-green" />
      <span className="font-medium text-ink">{online}</span> online
    </span>
  );
}
