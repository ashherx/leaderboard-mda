import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-display text-xl font-semibold text-ink">Page not found</p>
        <p className="mt-2 text-slate">That page doesn&apos;t exist, or the category was renamed or hidden.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-1 text-sm text-green hover:underline">
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Back to the leaderboard
        </Link>
      </main>
      <Footer />
    </>
  );
}
