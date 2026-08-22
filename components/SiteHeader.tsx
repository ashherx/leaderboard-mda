import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-end gap-2">
          {/* next/image blocks local SVGs by default (XSS safeguard) - a
              plain <img> is simpler here anyway, since there's no raster
              resizing to gain from the optimizer for a vector file. The
              source file itself has built-in padding around the artwork
              (common for icon exports), so the visible graphic sits above
              the image's true bottom edge no matter how the flex box is
              aligned - scaling up and clipping crops that padding away. */}
          <span className="relative h-7 w-7 shrink-0 overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/the-podium-logo-2.svg"
              alt=""
              className="absolute inset-0 h-full w-full scale-100 object-contain"
            />
          </span>
          <span className="font-display text-lg font-bold text-ink">The Podium</span>
        </Link>
        <nav className="flex items-center gap-5 text-sm text-slate">
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
