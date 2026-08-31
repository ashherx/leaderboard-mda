import { listAllLocationsForAdmin } from "@/lib/db/admin";
import { createLocationAction, updateLocationAction } from "../actions";

export const dynamic = "force-dynamic";

/**
 * Country/state/city CRUD - the admin-side lever for the state-by-state
 * rollout (see migration 0016): a new state starts inactive (or is created
 * directly) and only goes live on the public site (its own /[state] board,
 * plus the header's StateSwitcher) once toggled on here, the same way a
 * category's visibility works on the categories page.
 */
export default async function AdminLocationsPage() {
  const locations = await listAllLocationsForAdmin();
  const countries = locations.filter((l) => l.kind === "country");
  const states = locations.filter((l) => l.kind === "state");
  const cities = locations.filter((l) => l.kind === "city");

  const nextStateOrder = Math.max(0, ...states.map((s) => s.display_order)) + 1;

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Locations</h1>
      <p className="mt-1 text-sm text-slate">
        Only <span className="font-medium text-ink">active</span> states get their own public board
        (/state-slug) and appear in the header's state switcher - add one here, then flip it on once it's
        worth a board of its own.
      </p>

      <LocationTable title="Countries" rows={countries} />
      <LocationTable title="States" rows={states} />
      {cities.length > 0 && <LocationTable title="Cities" rows={cities} />}

      <form
        action={createLocationAction}
        className="mt-6 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-white p-4 text-sm"
      >
        <div>
          <label className="block text-xs text-slate">Kind</label>
          <select
            name="kind"
            defaultValue="state"
            className="mt-1 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          >
            <option value="state">State</option>
            <option value="country">Country</option>
            <option value="city">City</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate">Parent (for state/city)</label>
          <select
            name="parentId"
            className="mt-1 max-w-48 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          >
            <option value="">-</option>
            {[...countries, ...states].map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.kind})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate">Name</label>
          <input
            name="name"
            required
            className="mt-1 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-slate">Order</label>
          <input
            name="displayOrder"
            type="number"
            defaultValue={nextStateOrder}
            className="mt-1 w-20 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-ink px-3 py-1.5 font-display font-semibold text-white transition-colors hover:bg-green"
        >
          Add
        </button>
      </form>
    </div>
  );
}

function LocationTable({
  title,
  rows,
}: {
  title: string;
  rows: Awaited<ReturnType<typeof listAllLocationsForAdmin>>;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="mt-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate">{title}</h2>
      <div className="mt-2 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-border bg-canvas text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Parent</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2" />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((location) => (
              <tr key={location.id} className={`border-b border-border last:border-0 ${location.is_active ? "" : "opacity-50"}`}>
                <td colSpan={6} className="p-0">
                  {/* Same pattern as the categories admin page: the plain
                      Save button never submits isActive at all, only the
                      dedicated toggle does - so saving a name/order never
                      silently flips a location's visibility. */}
                  <form action={updateLocationAction} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <input type="hidden" name="id" value={location.id} />
                    <input
                      name="name"
                      defaultValue={location.name}
                      className="w-40 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                    <span className="w-28 truncate text-slate">{location.slug}</span>
                    <span className="w-32 truncate text-slate">{location.parentName ?? "-"}</span>
                    <input
                      name="displayOrder"
                      type="number"
                      defaultValue={location.display_order}
                      className="w-16 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                    <button
                      type="submit"
                      className="rounded-md bg-ink px-2 py-1 font-medium text-white transition-colors hover:bg-green"
                    >
                      Save
                    </button>
                    <button
                      type="submit"
                      name="isActive"
                      value={String(!location.is_active)}
                      className={location.is_active ? "text-slate underline" : "text-green underline"}
                    >
                      {location.is_active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
