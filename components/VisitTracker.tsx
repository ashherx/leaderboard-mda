"use client";

import { useEffect } from "react";

/** Fires once per page load to keep the sitewide "recent visitors" count fresh. Renders nothing. */
export function VisitTracker() {
  useEffect(() => {
    fetch("/api/visit", { method: "POST" }).catch(() => {
      /* best-effort — a missed ping just means one visitor undercounted briefly */
    });
  }, []);

  return null;
}
