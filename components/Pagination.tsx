"use client";

import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <nav className="mt-6 flex items-center justify-between text-sm">
      {page > 1 ? (
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 font-medium text-ink hover:text-green"
        >
          <ArrowLeft weight="duotone" className="h-3.5 w-3.5" />
          Previous
        </button>
      ) : (
        <span />
      )}
      <span className="font-mono text-slate">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 font-medium text-ink hover:text-green"
        >
          Next
          <ArrowRight weight="duotone" className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span />
      )}
    </nav>
  );
}
