import Link from "next/link";
import { listActiveStates } from "@/lib/db/locations";
import { StateSwitcher } from "@/components/StateSwitcher";

/**
 * currentStateSlug/currentCategorySlug let a page in a known state context
 * (the state and state+category pages) show that state selected and keep
 * the category when switching - every other page (claim, manage, rules,
 * the root directory, ...) renders the switcher unselected, since it has no
 * state of its own.
 */
export async function SiteHeader({
  currentStateSlug,
  currentCategorySlug,
}: {
  currentStateSlug?: string;
  currentCategorySlug?: string;
} = {}) {
  const states = await listActiveStates();

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-end gap-2">
            <span className="relative h-7 w-7 shrink-0 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand-mark.png"
                alt=""
                width={28}
                height={28}
                className="absolute inset-0 h-full w-full object-contain"
              />
            </span>
            <span className="font-display text-lg font-bold text-ink">The Podium</span>
          </Link>
          {/* Only worth showing once there's an actual choice to make - a
              single active state has nowhere else to switch to. */}
          {states.length > 1 && (
            <StateSwitcher states={states} currentSlug={currentStateSlug} currentCategorySlug={currentCategorySlug} />
          )}
        </div>
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-slate">
          <Link href="/rules" className="hover:text-ink">
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
