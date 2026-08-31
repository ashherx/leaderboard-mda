import Link from "next/link";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import { pagePath } from "@/lib/pagination";

export function Pagination({
  page,
  pageSize,
  total,
  basePath,
}: {
  page: number;
  pageSize: number;
  total: number;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Leaderboard pagination" className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link
          href={pagePath(basePath, page - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 font-medium text-ink hover:text-green"
        >
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link
          href={pagePath(basePath, page + 1)}
          rel="next"
          className="inline-flex items-center gap-1 font-medium text-ink hover:text-green"
        >
          Next
          <ArrowRight weight="duotone" className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
