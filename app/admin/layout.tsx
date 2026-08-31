import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "The Podium Admin" },
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
