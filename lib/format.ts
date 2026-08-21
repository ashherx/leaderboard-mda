export function formatCentsAsDollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

/** "3 minutes ago" / "2 days ago" style relative time, no external dependency. */
export function formatTimeSince(iso: string | null): string {
  if (!iso) return "just now";

  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));

  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];

  let value = seconds;
  for (const [amount, unit] of units) {
    if (value < amount) {
      const rounded = Math.floor(value);
      if (unit === "second" && rounded < 10) return "just now";
      return `${rounded} ${unit}${rounded === 1 ? "" : "s"} ago`;
    }
    value = Math.floor(value / amount);
  }
  return "a while ago";
}
