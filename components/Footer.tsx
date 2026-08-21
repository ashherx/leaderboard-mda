import Link from "next/link";

export function Footer() {
  return (
    <footer className="mx-auto max-w-4xl px-4 py-10 text-center text-sm text-slate">
      <Link href="/rules" className="hover:text-green hover:underline">
        Rules
      </Link>
    </footer>
  );
}
