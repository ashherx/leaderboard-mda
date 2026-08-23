"use client";

/**
 * Tri-state Yes/No/not-specified control, built from two independent
 * checkboxes rather than a radio pair - a radio group can't be clicked back
 * to "nothing selected" once one option is chosen, but a checkbox can always
 * be unchecked. Checking one here clears the other (so only one is ever
 * true), and clicking an already-checked one clears it back to null - that's
 * the "unselect" the field needs now that an answer isn't required.
 *
 * The actual submitted value is a single hidden `licensedInsured` input
 * (`"yes"` / `"no"`), rendered only once a choice has been made - so when
 * neither box is checked, the field is simply absent from the form
 * submission and the server sees "not specified" (see
 * app/api/listings/route.ts and app/api/manage/[token]/edit/route.ts).
 */
export function LicensedInsuredToggle({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  return (
    <div>
      <span className="block text-sm font-medium text-ink">
        Licensed &amp; insured? <span className="font-normal text-slate">(optional)</span>
      </span>
      <div className="mt-1 flex gap-2">
        <ToggleOption label="Yes" checked={value === true} onToggle={() => onChange(value === true ? null : true)} />
        <ToggleOption label="No" checked={value === false} onToggle={() => onChange(value === false ? null : false)} />
      </div>
      {value !== null && <input type="hidden" name="licensedInsured" value={value ? "yes" : "no"} />}
    </div>
  );
}

function ToggleOption({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label
      className={`cursor-pointer rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${
        checked ? "border-green bg-green/8 text-green" : "border-border text-slate hover:border-gold hover:text-ink"
      }`}
    >
      <input type="checkbox" checked={checked} onChange={onToggle} className="sr-only" />
      {label}
    </label>
  );
}
