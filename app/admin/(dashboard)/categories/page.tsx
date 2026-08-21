import { listAllCategoriesForAdmin } from "@/lib/db/admin";
import { createCategoryAction, updateCategoryAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const categories = await listAllCategoriesForAdmin();

  return (
    <div>
      <h1 className="text-xl font-semibold">Categories</h1>

      <div className="mt-4 overflow-x-auto rounded border border-gray-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
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
              <tr key={category.id} className={`border-b border-gray-100 last:border-0 ${category.is_active ? "" : "opacity-50"}`}>
                <td colSpan={6} className="p-0">
                  {/* One form per row. The Save button submits no `isActive`
                      field at all, so it never touches visibility — only the
                      dedicated toggle button (which submits its own name/value
                      pair) does. */}
                  <form action={updateCategoryAction} className="flex flex-wrap items-center gap-2 px-3 py-2">
                    <input type="hidden" name="id" value={category.id} />
                    <input name="name" defaultValue={category.name} className="w-44 rounded border border-gray-300 px-2 py-1" />
                    <span className="w-28 truncate text-gray-500">{category.slug}</span>
                    <input
                      name="minBidDollars"
                      type="number"
                      min={1}
                      defaultValue={category.min_bid_cents / 100}
                      className="w-16 rounded border border-gray-300 px-2 py-1"
                    />
                    <input
                      name="displayOrder"
                      type="number"
                      defaultValue={category.display_order}
                      className="w-16 rounded border border-gray-300 px-2 py-1"
                    />
                    <button type="submit" className="rounded bg-gray-900 px-2 py-1 text-white">
                      Save
                    </button>
                    <button
                      type="submit"
                      name="isActive"
                      value={String(!category.is_active)}
                      className={category.is_active ? "text-gray-500 underline" : "text-green-700 underline"}
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
        className="mt-6 flex items-end gap-2 rounded border border-gray-200 bg-white p-4 text-sm"
      >
        <div>
          <label className="block text-xs text-gray-500">New category name</label>
          <input name="name" required className="mt-1 rounded border border-gray-300 px-2 py-1" />
        </div>
        <div>
          <label className="block text-xs text-gray-500">Min bid ($)</label>
          <input
            name="minBidDollars"
            type="number"
            min={1}
            defaultValue={5}
            className="mt-1 w-20 rounded border border-gray-300 px-2 py-1"
          />
        </div>
        <button type="submit" className="rounded bg-gray-900 px-3 py-1.5 text-white">
          Add
        </button>
      </form>
    </div>
  );
}
