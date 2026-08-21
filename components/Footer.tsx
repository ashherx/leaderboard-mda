import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto flex max-w-4xl flex-col items-center gap-2 px-4 py-10 text-center text-sm text-slate">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/the-podium-logo-2.svg" alt="" width={24} height={24} />
      <Link href="/rules" className="hover:text-green hover:underline">
        Rules
      </Link>
      <span className="text-xs text-slate">The Podium, by Million Dollar Agency</span>
    </footer>
  );
}
