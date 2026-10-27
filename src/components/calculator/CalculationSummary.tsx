import { AlertTriangle } from "lucide-react";
import { Card, Field, Row, inputClass } from "@/components/ui";
import { SERVICE_LABELS } from "@/lib/calculator";
import { formatINR, formatSqft, parseNumber } from "@/lib/format";
import type { CalculationResult, DiscountType, LineService } from "@/types/calculator";

interface Props {
  result: CalculationResult;
  original: CalculationResult;
  unique: CalculationResult;
  discountType: DiscountType;
  discountValue: string;
  onDiscountChange: (patch: { discountType?: DiscountType; discountValue?: string }) => void;
}

export default function CalculationSummary({
  result,
  original,
  unique,
  discountType,
  discountValue,
  onDiscountChange,
}: Props) {
  const discountOk =
    discountValue.trim() === "" || (Number.isFinite(parseNumber(discountValue)) && parseNumber(discountValue) >= 0);

  if (!result.valid) {
    return (
      <Card title="Price summary">
        <div className="flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <ul className="space-y-1">
            {result.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
        {!discountOk && <p className="mt-2 text-xs text-red-600">Enter a valid discount.</p>}
      </Card>
    );
  }

  const services = (Object.keys(result.serviceTotals) as LineService[]).filter((k) =>
    result.items.some((it) => it.service === k),
  );
  const diff = Math.abs(original.subtotal - unique.subtotal);
  const cheaper = unique.subtotal < original.subtotal ? "Unique design" : "Original quotation";

  return (
    <div className="space-y-4">
      <Card title="Building summary">
        <dl className="divide-y divide-stone-100">
          <Row label="Ground floor area" value={formatSqft(result.groundFloorArea)} />
          <Row label="Building" value={result.buildingLabel} />
          <Row label="Physical floors" value={result.levels} />
          <Row label="Total construction area" value={formatSqft(result.totalConstructedArea)} strong />
          <Row label="Unique floor plans" value={result.uniqueDesigns} />
          <Row label="Repeated floor plans" value={result.repeatedDesigns} />
          <Row label="Architecture billing area" value={formatSqft(result.architectureBillingArea)} />
          <Row label="Structural billing area" value={formatSqft(result.structuralArea)} />
          <Row label="Electrical/plumbing area" value={formatSqft(result.electricalPlumbingArea)} />
        </dl>
      </Card>

      <Card title="Price">
        <dl className="divide-y divide-stone-100">
          {services.map((k) => (
            <Row key={k} label={SERVICE_LABELS[k]} value={formatINR(result.serviceTotals[k])} />
          ))}
          <Row label="Subtotal" value={formatINR(result.subtotal)} strong />
        </dl>

        <div className="mt-3 grid grid-cols-[1fr_auto] items-end gap-2">
          <Field label="Discount" error={discountOk ? null : "Enter a valid number."}>
            <input
              className={inputClass}
              inputMode="decimal"
              value={discountValue}
              onChange={(e) => onDiscountChange({ discountValue: e.target.value })}
              placeholder="0"
            />
          </Field>
          <div className="flex h-12 overflow-hidden rounded-xl border border-stone-300">
            {(["fixed", "percent"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onDiscountChange({ discountType: t })}
                className={`px-3 text-sm font-semibold ${
                  discountType === t ? "bg-emerald-700 text-white" : "bg-white text-stone-700"
                }`}
              >
                {t === "fixed" ? "₹" : "%"}
              </button>
            ))}
          </div>
        </div>

        <dl className="mt-3 divide-y divide-stone-100">
          <Row label="Discount applied" value={`- ${formatINR(result.discountAmount)}`} />
        </dl>

        <div className="mt-3 rounded-xl bg-emerald-800 p-4 text-white">
          <p className="text-xs uppercase tracking-wide text-emerald-100">Final payable amount</p>
          <p className="text-3xl font-bold">{formatINR(result.finalAmount)}</p>
        </div>
      </Card>

      <Card title="Original vs Unique design">
        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs text-stone-500">Original quotation</p>
            <p className="text-lg font-semibold">{original.valid ? formatINR(original.subtotal) : "—"}</p>
          </div>
          <div className="rounded-xl border border-stone-200 p-3">
            <p className="text-xs text-stone-500">Unique design</p>
            <p className="text-lg font-semibold">{unique.valid ? formatINR(unique.subtotal) : "—"}</p>
          </div>
        </div>
        {original.valid && unique.valid && (
          <p className="mt-3 text-sm text-stone-600">
            {diff === 0 ? (
              <>Both methods give the same price for the selected services.</>
            ) : (
              <>
                {cheaper} is {formatINR(diff)} lower. Original bills architecture on{" "}
                {formatSqft(original.architectureBillingArea)}; unique design bills it on{" "}
                {formatSqft(unique.architectureBillingArea)} ({unique.uniqueDesigns} new plan
                {unique.uniqueDesigns > 1 ? "s" : ""}). Identical repeats also have no structural or electrical/plumbing design charge in Unique Design pricing. Prices are before discount.
              </>
            )}
          </p>
        )}
      </Card>

      {result.warnings.length > 0 && (
        <Card title="Please note">
          <ul className="space-y-2">
            {result.warnings.map((w) => (
              <li key={w} className="flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
