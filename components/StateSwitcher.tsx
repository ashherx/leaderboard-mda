"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";

/**
 * Switches which state's board you're looking at - a real navigation (each
 * state is its own route, /[state]?category=...), unlike CategoryTabs/
 * CategoryDropdown which swap client-side within one page. Only ever lists
 * *active* states (see lib/db/locations.ts's listActiveStates) - an admin
 * turns a new one on once it's worth a board of its own (see the product
 * discussion this component came from).
 */
export function StateSwitcher({
  states,
  currentSlug,
  categorySlug,
}: {
  states: { slug: string; name: string }[];
  currentSlug: string;
  /** Preserved across the switch so picking a new state keeps you on the same category, e.g. Plumbing in Texas -> Plumbing in Oklahoma. */
  categorySlug?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = states.find((s) => s.slug === currentSlug);

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

  // Nothing to switch between yet (just Texas at launch) - show a plain
  // label instead of a dropdown with one dead-end option.
  if (states.length <= 1) {
    return current ? <span className="text-sm font-medium text-slate">{current.name}</span> : null;
  }

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1 rounded-md px-1.5 py-1 text-sm font-medium text-slate outline-none transition-colors hover:text-ink"
      >
        <span>{current?.name ?? "Choose a state"}</span>
        <CaretDown weight="bold" className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 z-10 mt-1 max-h-64 w-40 overflow-auto rounded-md border border-border bg-white py-1 shadow-lg"
        >
          {states.map((state) => {
            const isSelected = state.slug === currentSlug;
            const href = `/${state.slug}${categorySlug ? `?category=${categorySlug}` : ""}`;
            return (
              <li key={state.slug}>
                <Link
                  href={href}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between gap-2 px-3 py-1.5 text-left text-sm transition-colors hover:bg-canvas ${
                    isSelected ? "font-medium text-ink" : "text-slate"
                  }`}
                >
                  {state.name}
                  {isSelected && <Check weight="bold" className="h-3.5 w-3.5 shrink-0 text-gold" />}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
