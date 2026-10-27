import { ChevronDown } from "lucide-react";
import { Card } from "@/components/ui";
import { formatINR, formatNumber } from "@/lib/format";
import { designPricing } from "@/lib/pricing-config";
import type { CalculationResult } from "@/types/calculator";

export default function PricingBreakdown({ result }: { result: CalculationResult }) {
  if (!result.valid) return null;
  const c = designPricing;
  const elevation = result.items.find((item) => item.service === "elevation3D");

  const assumptions =
    result.mode === "original"
      ? [
          `Architecture ${formatINR(c.architecture)}/sqft, structural ${formatINR(c.structural)}/sqft and electrical & plumbing ${formatINR(c.electricalPlumbing)}/sqft are applied to the total area of all floors.`,
          `Additional floor service is ${formatINR(c.additionalFloor)}/sqft, added separately on the area chosen in "More options".`,
        ]
      : [
          `Architecture ${formatINR(c.architecture)}/sqft is charged only on new plans. Repeated plans: ${formatINR(c.architectureRepeatedPlan)}/sqft.`,
          `Structural: ${formatINR(c.structural)}/sqft on unique layouts, ${formatINR(c.structuralRepeatedLayout)}/sqft on repeated layouts.`,
          `Electrical & plumbing: ${formatINR(c.electricalPlumbing)}/sqft on unique layouts, ${formatINR(c.electricalPlumbingRepeatedLayout)}/sqft on repeated layouts.`,
          `Additional floor service (${formatINR(c.additionalPhysicalFloorDesign)}/sqft) applies only when switched on; services it includes are not billed twice.`,
        ];

  return (
    <Card>
      <details>
        <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-stone-900">
          <span>Detailed breakdown</span>
          <ChevronDown className="h-5 w-5 text-stone-500" />
        </summary>

        <div className="mt-4 space-y-5">
          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Floor by floor</h3>
            <ul className="space-y-2">
              {result.floors.map((f) => (
                <li key={f.index} className="rounded-xl bg-stone-50 p-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-medium">{f.label}</span>
                    <span>{formatNumber(f.areaSqft)} sqft</span>
                  </div>
                  <p className="text-xs text-stone-600">
                    {f.isUnique
                      ? f.modified
                        ? "Modified copy – revised plan"
                        : "New design"
                      : `Same as ${f.rootLabel} – no new plan charge`}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">Charges</h3>
            {result.items.length === 0 ? (
              <p className="text-sm text-stone-500">No services selected.</p>
            ) : (
              <ul className="space-y-2">
                {result.items.map((it) => (
                  <li key={it.id} className="rounded-xl border border-stone-200 p-3 text-sm">
                    <p className="font-medium text-stone-900">{it.label}</p>
                    <p className="mt-0.5 text-stone-600">{it.formula}</p>
                    {it.note && <p className="mt-0.5 text-xs text-stone-500">{it.note}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-stone-800">How this was calculated</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">
              <li>Ground floor area = length × width.</li>
              <li>Total construction area = sum of the area of every physical floor.</li>
              {assumptions.map((a) => (
                <li key={a}>{a}</li>
              ))}
              {elevation && (
                <li>3D front elevation for {result.buildingLabel}: {formatINR(elevation.rate)} per design, charged for {elevation.quantity} design(s). The price follows the building type or your entered price.</li>
              )}
              <li>Amounts are not rounded; they are shown exactly as calculated.</li>
            </ul>
          </div>
        </div>
      </details>
    </Card>
  );
}
