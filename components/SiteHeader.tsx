import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          {/* next/image blocks local SVGs by default (XSS safeguard) — a
              plain <img> is simpler here anyway, since there's no raster
              resizing to gain from the optimizer for a vector file. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/the-podium-logo-2.svg" alt="" width={28} height={28} />
          <span className="font-display text-lg font-bold text-ink">The Podium</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate">
          <Link href="/" className="hover:text-ink">
            Leaderboard
          </Link>
          <Link href="/rules" className="hover:text-ink">
            Rules
          </Link>
        </nav>
      </div>
    </header>
  );
}
