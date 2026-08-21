import { listAllCategoriesForAdmin } from "@/lib/db/admin";
import { createCategoryAction, updateCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listAllCategoriesForAdmin();

  return (
    <div>
      <h1 className="font-display text-xl font-bold text-ink">Categories</h1>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-canvas text-xs uppercase tracking-wide text-slate">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Slug</th>
              <th className="px-3 py-2">Min bid ($)</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2" />
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.id} className={`border-b border-border last:border-0 ${category.is_active ? "" : "opacity-50"}`}>
                <td colSpan={6} className="p-0">
                  {/* One form per row. The Save button submits no `isActive`
                      field at all, so it never touches visibility — only the
                      dedicated toggle button (which submits its own name/value
                      pair) does. */}
                  <form action={updateCategoryAction} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <input type="hidden" name="id" value={category.id} />
                    <input
                      name="name"
                      defaultValue={category.name}
                      className="w-44 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                    <span className="w-28 truncate text-slate">{category.slug}</span>
                    <input
                      name="minBidDollars"
                      type="number"
                      min={1}
                      defaultValue={category.min_bid_cents / 100}
                      className="w-16 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
                    />
                    <input
                      name="displayOrder"
                      type="number"
                      defaultValue={category.display_order}
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
                      value={String(!category.is_active)}
                      className={category.is_active ? "text-slate underline" : "text-green underline"}
                    >
                      {category.is_active ? "Hide" : "Show"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form
        action={createCategoryAction}
        className="mt-6 flex items-end gap-2 rounded-xl border border-border bg-white p-4 text-sm"
      >
        <div>
          <label className="block text-xs text-slate">New category name</label>
          <input
            name="name"
            required
            className="mt-1 rounded-md border border-border px-2 py-1 outline-none focus:border-gold"
          />
        </div>
        <div>
          <label className="block text-xs text-slate">Min bid ($)</label>
          <input
            name="minBidDollars"
            type="number"
            min={1}
            defaultValue={5}
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
