import { listAllStatesForAdmin } from "@/lib/db/admin";
import { createStateAction, updateStateAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const states = await listAllStatesForAdmin();
  const nextDisplayOrder = Math.max(0, ...states.map((s) => s.display_order)) + 1;

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Locations</h1>
      <p className="mt-1 text-sm text-slate">
        Only states with real local demand should be shown - hide a state rather than deleting it once listings exist there.
      </p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-canvas text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2" />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {states.map((state) => (
              <tr key={state.id} className={`border-b border-border last:border-0 ${state.is_active ? "" : "opacity-50"}`}>
                <td colSpan={5} className="p-0">
                  {/* One form per row. The Save button submits no `isActive`
                      field at all, so it never touches visibility - only the
                      dedicated toggle button (which submits its own name/value
                      pair) does. */}
                  <form action={updateStateAction} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <input type="hidden" name="id" value={state.id} />
                    <input
                      name="name"
                      defaultValue={state.name}
                      className="w-44 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                    <span className="w-28 truncate text-slate">{state.slug}</span>
                    <input
                      name="displayOrder"
                      type="number"
                      defaultValue={state.display_order}
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
                      value={String(!state.is_active)}
                      className={state.is_active ? "text-slate underline" : "text-green underline"}
                    >
                      {state.is_active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={createStateAction}
        className="mt-6 flex items-end gap-2 rounded-xl border border-border bg-white p-4 text-sm"
      >
        <div>
          <label className="block text-xs text-slate">New state name</label>
          <input
            name="name"
            required
            placeholder="California"
            className="mt-1 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-slate">Order</label>
          <input
            name="displayOrder"
            type="number"
            defaultValue={nextDisplayOrder}
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
