import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
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
        <nav aria-label="Primary" className="flex items-center gap-5 text-sm text-slate">
          {/* <Link href="/" className="hover:text-ink">
            Leaderboard
          </Link> */}
          <Link href="/rules" className="hover:text-ink">
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
