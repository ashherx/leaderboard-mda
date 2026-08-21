import Link from "next/link";

export function Pagination({
  basePath,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => (p === 1 ? basePath : `${basePath}?page=${p}`);

  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="font-medium text-ink hover:text-green">
          ← Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="font-medium text-ink hover:text-green">
          Next →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
