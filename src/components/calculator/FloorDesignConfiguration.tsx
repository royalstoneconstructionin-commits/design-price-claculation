import { Card, inputClass } from "@/components/ui";
import { eligibleReferences, floorLabel, resolveRoot } from "@/lib/floor-design";
import { formatSqft, parseNumber } from "@/lib/format";
import type { FloorFormState, FormState } from "@/types/calculator";

interface Props {
  form: FormState;
  onFloorChange: (index: number, patch: Partial<FloorFormState>) => void;
  onAdvancedChange: (on: boolean) => void;
}

export default function FloorDesignConfiguration({ form, onFloorChange, onAdvancedChange }: Props) {
  const groundArea = parseNumber(form.length) * parseNumber(form.width);
  const hasArea = Number.isFinite(groundArea) && groundArea > 0;

  return (
    <Card
      title="3. Floor designs"
      subtitle="Ground and first floors have separate designs. For higher floors, choose an earlier matching design to charge it only once in Unique Design pricing."
    >
      <ul className="space-y-3">
        {Array.from({ length: form.levels }, (_, i) => {
          const floor = form.floors[i];
          const refs = eligibleReferences(i);
          const isRepeat = i >= 2 && floor.designRef !== null && !floor.modified;
          const root = resolveRoot(form.floors, i);

          return (
            <li key={i} className="rounded-xl border border-stone-200 bg-stone-50 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-stone-900">{floorLabel(i)}</p>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    isRepeat ? "bg-stone-200 text-stone-700" : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isRepeat ? "No new plan charge" : floor.modified ? "Revised plan charge" : "New plan charge"}
                </span>
              </div>

              {refs.length === 0 ? (
                <p className="mt-2 text-sm text-stone-600">New design</p>
              ) : (
                <div className="mt-2 space-y-2">
                  <select
                    className={inputClass}
                    value={floor.designRef === null ? "new" : String(floor.designRef)}
                    onChange={(e) =>
                      onFloorChange(i, {
                        designRef: e.target.value === "new" ? null : Number(e.target.value),
                        modified: e.target.value === "new" ? false : floor.modified,
                      })
                    }
                    aria-label={`Design for ${floorLabel(i)}`}
                  >
                    <option value="new">New floor design</option>
                    {refs.map((j) => (
                      <option key={j} value={j}>
                        Same as {floorLabel(j)}
                      </option>
                    ))}
                  </select>

                  {floor.designRef !== null && (
                    <>
                      {isRepeat && root !== floor.designRef && (
                        <p className="text-xs text-stone-500">Uses the original {floorLabel(root)} design.</p>
                      )}
                      <label className="flex items-start gap-2 text-sm text-stone-700">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-5 w-5 accent-emerald-700"
                          checked={floor.modified}
                          onChange={(e) => onFloorChange(i, { modified: e.target.checked })}
                        />
                        <span>This copy needs changes (bill as a revised plan)</span>
                      </label>
                    </>
                  )}
                </div>
              )}

              {form.advancedAreas && i > 0 && (
                <div className="mt-2">
                  <label className="mb-1 block text-xs font-medium text-stone-600">
                    Area of this floor (sqft)
                  </label>
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={floor.areaOverride}
                    placeholder={hasArea ? `${groundArea} (same as ground floor)` : "same as ground floor"}
                    onChange={(e) => onFloorChange(i, { areaOverride: e.target.value })}
                  />
                  {floor.areaOverride.trim() !== "" &&
                    !(parseNumber(floor.areaOverride) > 0) && (
                      <p className="mt-1 text-xs text-red-600">Enter a number greater than 0.</p>
                    )}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <label className="mt-4 flex items-start gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          className="mt-0.5 h-5 w-5 accent-emerald-700"
          checked={form.advancedAreas}
          onChange={(e) => onAdvancedChange(e.target.checked)}
        />
        <span>Floors have different areas (advanced)</span>
      </label>
      {form.advancedAreas && (
        <p className="mt-1 text-xs text-stone-500">
          Leave a floor&apos;s area empty to use the ground floor area ({hasArea ? formatSqft(groundArea) : "—"}).
        </p>
      )}
    </Card>
  );
}
