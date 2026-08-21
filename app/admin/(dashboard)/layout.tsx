import Link from "next/link";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";

const NAV_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/categories", label: "Categories" },
];

// Internal ops tool, but styled on the same brand system as the public
// app (see globals.css) rather than plain system-ui/gray-scale — same
// fonts, colors, and card treatment, just a leaner layout.
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasValidAdminSession()) redirect("/admin/login");

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex max-w-360 items-center justify-between px-6 py-3">
          <nav className="flex items-center gap-5">
            <Link href="/admin" className="font-display text-base font-bold text-ink">
              The Podium <span className="font-sans text-sm font-normal text-slate">Admin</span>
            </Link>
            <div className="flex items-center gap-4 text-sm text-slate">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-ink">
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>
          <form action="/api/admin/logout" method="post">
            <button type="submit" className="text-sm text-slate hover:text-ink">
              Log out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-360 px-6 py-8">{children}</main>
    </div>
  );
}
