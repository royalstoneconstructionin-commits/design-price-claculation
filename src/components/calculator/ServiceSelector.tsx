import { Check } from "lucide-react";
import { Card, Field, inputClass } from "@/components/ui";
import { formatINR, parseNumber } from "@/lib/format";
import { designPricing } from "@/lib/pricing-config";
import { buildingLabel } from "@/lib/floor-design";
import type { AdditionalFloorBasis, FormState, ServiceKey } from "@/types/calculator";

interface Props {
  form: FormState;
  onServiceChange: (key: ServiceKey, on: boolean) => void;
  onChange: (patch: Partial<FormState>) => void;
}

const SERVICES: { key: ServiceKey; label: string; hint: string }[] = [
  { key: "architecture", label: "Architectural drawing", hint: "Floor plans" },
  { key: "structural", label: "Structural design", hint: "Foundation, plinth beam, column, beam, slab, staircase" },
  { key: "electricalPlumbing", label: "Electrical & plumbing", hint: "Drawings" },
  { key: "elevation3D", label: "3D front elevation", hint: "With cost estimate" },
];

export default function ServiceSelector({ form, onServiceChange, onChange }: Props) {
  const elevationRange = designPricing.elevationRanges[form.levels - 1];
  const rateIsBlank = form.elevationRate.trim() === "";
  const rateIsValid = rateIsBlank
    ? !!elevationRange
    : Number.isFinite(parseNumber(form.elevationRate)) && parseNumber(form.elevationRate) > 0;
  return (
    <Card title="4. Services needed">
      <div className="space-y-2">
        {SERVICES.map((s) => {
          const on = form.services[s.key];
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onServiceChange(s.key, !on)}
              aria-pressed={on}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                on ? "border-emerald-600 bg-emerald-50" : "border-stone-300 bg-white"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${
                  on ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-400 bg-white"
                }`}
              >
                {on && <Check className="h-4 w-4" />}
              </span>
              <span>
                <span className="block text-sm font-medium text-stone-900">{s.label}</span>
                <span className="block text-xs text-stone-500">{s.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {form.services.elevation3D && (
        <div className="mt-3 space-y-3">
          <Field
            label={`3D front elevation price for ${buildingLabel(form.levels)} (₹ per design)`}
            hint={elevationRange
              ? `Suggested: ${formatINR(elevationRange.min)}–${formatINR(elevationRange.max)}. Leave empty to charge the starting price of ${formatINR(elevationRange.min)}.`
              : "Custom quotation required for G+5 and above. Enter your agreed price per design."}
            error={rateIsValid ? null : rateIsBlank ? "Enter a custom elevation price." : "Enter a price greater than 0."}
          >
            <input
              className={inputClass}
              inputMode="decimal"
              value={form.elevationRate}
              placeholder={elevationRange ? String(elevationRange.min) : "Enter custom price"}
              onChange={(e) => onChange({ elevationRate: e.target.value })}
            />
          </Field>
          <Field
            label="Number of 3D elevation designs"
            hint="Charged once per elevation design."
            error={
              Number.isInteger(parseNumber(form.elevationCount)) && parseNumber(form.elevationCount) >= 1
                ? null
                : "Enter a whole number, at least 1."
            }
          >
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.elevationCount}
              onChange={(e) => onChange({ elevationCount: e.target.value })}
            />
          </Field>
        </div>
      )}

      <details className="mt-4 rounded-xl border border-stone-200 bg-stone-50">
        <summary className="cursor-pointer select-none px-3 py-3 text-sm font-medium text-stone-800">
          More options (additional floors, revisions)
        </summary>
        <div className="space-y-3 border-t border-stone-200 p-3">
          <Field
            label="Additional floor service – area basis"
            hint={form.mode === "unique"
              ? "Applies only to new or modified designs from the second floor onward. Identical repeated floors are free."
              : "The rate is applied to the total area of every floor from the second floor onward."}
          >
            <select
              className={inputClass}
              value={form.additionalFloorBasis}
              onChange={(e) => onChange({ additionalFloorBasis: e.target.value as AdditionalFloorBasis })}
            >
              <option value="second-floor-onward">Floors from the second onward (default)</option>
              <option value="custom">Custom area (I will enter it)</option>
              <option value="off">Do not charge</option>
            </select>
          </Field>

          {form.additionalFloorBasis === "custom" && (
            <Field
              label="Custom area for additional floor service (sqft)"
              error={parseNumber(form.additionalFloorCustomArea) >= 0 ? null : "Enter 0 or a positive number."}
            >
              <input
                className={inputClass}
                inputMode="decimal"
                value={form.additionalFloorCustomArea}
                onChange={(e) => onChange({ additionalFloorCustomArea: e.target.value })}
              />
            </Field>
          )}

          {form.mode === "unique" && form.additionalFloorBasis !== "off" && (
            <label className="flex items-start gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                className="mt-0.5 h-5 w-5 accent-emerald-700"
                checked={form.additionalFloorInUnique}
                onChange={(e) => onChange({ additionalFloorInUnique: e.target.checked })}
              />
              <span>Charge the additional floor service in unique design pricing</span>
            </label>
          )}

          <Field
            label="Site-specific plan revisions"
            hint="Number of revisions (rate set in pricing-config.ts)."
            error={
              form.siteRevisions.trim() === "" ||
              (Number.isInteger(parseNumber(form.siteRevisions)) && parseNumber(form.siteRevisions) >= 0)
                ? null
                : "Enter a whole number (0 or more)."
            }
          >
            <input
              className={inputClass}
              inputMode="numeric"
              value={form.siteRevisions}
              onChange={(e) => onChange({ siteRevisions: e.target.value })}
            />
          </Field>
        </div>
      </details>
    </Card>
  );
}
