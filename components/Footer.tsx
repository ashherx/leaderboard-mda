import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-4xl items-center justify-between px-4 py-6 text-sm text-slate">
      <div className="flex items-center gap-2">
        {/* Source SVG has built-in padding around the artwork — scale up and
            clip to crop that away (see SiteHeader for the same fix). */}
        <span className="relative h-5 w-5 shrink-0 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/the-podium-logo-2.svg"
            alt=""
            className="absolute inset-0 h-full w-full scale-125 object-contain"
          />
        </span>
        <span className="text-xs text-slate">The Podium, by Million Dollar Agency</span>
      </div>
      <Link href="/rules" className="hover:text-green hover:underline">
        Rules
      </Link>
    </footer>
  );
}
