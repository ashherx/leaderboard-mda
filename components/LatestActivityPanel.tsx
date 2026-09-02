import { Broadcast } from "@phosphor-icons/react/dist/ssr";
import type { ActivityItem } from "@/lib/db/activity";
import { formatTimeSince } from "@/lib/format";

export function LatestActivityPanel({ activity }: { activity: ActivityItem[] }) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <p className="flex items-center gap-1 font-display text-xs font-semibold text-ink">
        <Broadcast weight="duotone" className="h-4 w-4 text-green" />
        Latest activity
      </p>
      {activity.length === 0 ? (
        <p className="mt-2 text-xs text-slate">No recent claims yet.</p>
      ) : (
        <ul className="mt-1 divide-y divide-border">
          {activity.map((item, i) => (
            <li key={`${item.listingId}-${i}`}>
              <a
                href={`/r/${item.listingId}`}
                rel="sponsored ugc nofollow noopener noreferrer"
                className="flex items-center gap-2 py-1.5 text-xs hover:bg-canvas"
              >
                {item.logoUrl ? (
                  // object-contain (not cover) + a padded canvas backing so a
                  // non-square logo doesn't get cropped at this small size.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.logoUrl}
                    alt=""
                    width={20}
                    height={20}
                    loading="lazy"
                    decoding="async"
                    className="h-5 w-5 shrink-0 rounded bg-canvas object-contain p-0.5"
                  />
                ) : (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-canvas text-[10px] text-slate">
                    {item.providerName.charAt(0).toUpperCase()}
                  </span>
                )}
                <span className="min-w-0 flex-1 truncate font-display font-medium text-ink">
                  {item.providerName}
                </span>
                <span className="shrink-0 text-slate">{formatTimeSince(item.completedAt)}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
