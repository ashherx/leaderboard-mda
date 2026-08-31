export function parsePageParam(value: string | undefined): number | null {
  if (value === undefined) return 1;
  if (!/^[1-9]\d*$/.test(value)) return null;

  const page = Number(value);
  return Number.isSafeInteger(page) ? page : null;
}

export function pagePath(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export function pageExists(page: number, total: number, pageSize: number): boolean {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return page <= totalPages;
}
