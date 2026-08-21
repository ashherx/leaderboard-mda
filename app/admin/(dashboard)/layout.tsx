import Link from "next/link";
import { redirect } from "next/navigation";
import { hasValidAdminSession } from "@/lib/admin-auth";

// Deliberately plain — this is an internal ops tool, not the public brand.
export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  if (!hasValidAdminSession()) redirect("/admin/login");

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }} className="min-h-screen bg-gray-50 text-gray-900">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold text-gray-900">
            Admin
          </Link>
          <Link href="/admin/listings" className="text-gray-600 hover:text-gray-900">
            Listings
          </Link>
          <Link href="/admin/categories" className="text-gray-600 hover:text-gray-900">
            Categories
          </Link>
        </nav>
        <form action="/api/admin/logout" method="post">
          <button type="submit" className="text-sm text-gray-500 hover:text-gray-900">
            Log out
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
    </div>
  );
}
