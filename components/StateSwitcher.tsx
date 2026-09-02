"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CaretDown, Check } from "@phosphor-icons/react";
import { useLeaderboardNavigation } from "@/components/LeaderboardNavigation";

/**
 * Header-level state switcher - only rendered by SiteHeader when 2+ states
 * are active (see its comment). Styled as an inline "/ Texas" breadcrumb
 * next to the logo rather than a boxed input (unlike CategoryDropdown,
 * which it's deliberately not reusing for that reason - this needs to read
 * as part of the wordmark, not a form control).
 *
 * Preserves the current category across the switch when there is one
 * (categories are global, not per-state), so switching state from a
 * category page lands on the same category in the new state rather than
 * dropping back to its "All" board.
 */
export function StateSwitcher({
  states,
  currentSlug,
  currentCategorySlug,
}: {
  states: { slug: string; name: string }[];
  currentSlug?: string;
  currentCategorySlug?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = states.find((s) => s.slug === currentSlug);
  const { startNavigation } = useLeaderboardNavigation();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function selectState(slug: string) {
    setOpen(false);
    if (slug === currentSlug) return;
    startNavigation();
    router.push(currentCategorySlug ? `/${slug}/${currentCategorySlug}` : `/${slug}`);
  }

  return (
    <div className="flex items-end gap-2">
      <span className="text-lg text-border" aria-hidden="true">
        /
      </span>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className="flex items-center gap-1 font-display text-md text-ink outline-none transition-colors hover:text-green"
        >
          {current?.name ?? "Choose a state"}
          <CaretDown
            weight="bold"
            className={`h-3 w-3 shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute z-10 mt-1 max-h-64 w-40 overflow-auto rounded-md border border-border bg-white py-1 shadow-lg"
          >
            {states.map((state) => {
              const isSelected = state.slug === currentSlug;
              return (
                <li key={state.slug}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectState(state.slug)}
                    className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-canvas ${
                      isSelected ? "font-medium text-ink" : "text-slate"
                    }`}
                  >
                    {state.name}
                    {isSelected && <Check weight="bold" className="h-3.5 w-3.5 shrink-0 text-gold" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
