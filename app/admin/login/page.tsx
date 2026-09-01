import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

// Route segment config (`dynamic`) must be exported from a Server Component
// module - a "use client" page.tsx silently ignores it, which left this
// page attempting static prerendering even after this was added directly
// to the old client page file. Splitting the interactive form into its own
// client component lets this thin page stay a Server Component.
export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
