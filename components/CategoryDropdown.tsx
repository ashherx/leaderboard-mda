"use client";

import { useEffect, useRef, useState } from "react";
import { CaretDown, Check } from "@phosphor-icons/react";

/** Styled to match the rest of the app's inputs/buttons - a native <select> can't be themed consistently across browsers. */
export function CategoryDropdown({
  categories,
  selectedSlug,
  onSelect,
  className = "",
  placeholder = "Choose a category",
  buttonClassName = "px-4 py-2.5",
}: {
  categories: { slug: string; name: string }[];
  selectedSlug: string | undefined;
  onSelect: (slug: string) => void;
  className?: string;
  placeholder?: string;
  /** Overrides the trigger button's padding/text sizing for tighter contexts (e.g. the header's state switcher) without touching the layout/hover/focus styles every caller shares. */
  buttonClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = categories.find((c) => c.slug === selectedSlug);

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

  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex w-full items-center justify-between gap-2 rounded-md border border-border bg-white text-left text-ink outline-none transition-colors hover:border-gold focus:border-green ${buttonClassName}`}
      >
        <span className="truncate">{selected?.name ?? placeholder}</span>
        <CaretDown
          weight="bold"
          className={`h-3.5 w-3.5 shrink-0 text-slate transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-white py-1 shadow-lg"
        >
          {categories.map((category) => {
            const isSelected = category.slug === selectedSlug;
            return (
              <li key={category.slug}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(category.slug);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-canvas ${
                    isSelected ? "font-medium text-ink" : "text-slate"
                  }`}
                >
                  {category.name}
                  {isSelected && <Check weight="bold" className="h-3.5 w-3.5 shrink-0 text-gold" />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
