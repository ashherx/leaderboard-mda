import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-slate">
      <div className="flex items-center gap-2">
        {/* Source SVG has built-in padding around the artwork - scale up and
            clip to crop that away (see SiteHeader for the same fix). */}
        <span className="relative h-5 w-5 shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/the-podium-logo-2.svg"
            alt=""
            className="absolute inset-0 h-full w-full scale-100 object-contain"
          />
        </span>
        <span className="text-xs text-slate">The Podium, by Million Dollar Agency</span>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/rules" className="hover:text-green hover:underline">
          Rules
        </Link>
        <Link href="/terms" className="hover:text-green hover:underline">
          Terms
        </Link>
        <Link href="/privacy" className="hover:text-green hover:underline">
          Privacy
        </Link>
        <Link href="/refunds" className="hover:text-green hover:underline">
          Refunds
        </Link>
      </div>
    </footer>
  );
}
