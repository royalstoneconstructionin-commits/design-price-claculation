import { Plus, Trash2 } from "lucide-react";
import { Card, inputClass } from "@/components/ui";
import { formatINR, formatNumber } from "@/lib/format";
import { computePaymentSchedule } from "@/lib/quotation";
import type { PaymentFormRow } from "@/types/calculator";

interface Props {
  rows: PaymentFormRow[];
  finalAmount: number;
  onChange: (rows: PaymentFormRow[]) => void;
  /** Hide the editing controls (used when only showing the result). */
  readOnly?: boolean;
}

export default function PaymentSchedule({ rows, finalAmount, onChange, readOnly }: Props) {
  const schedule = computePaymentSchedule(rows, finalAmount);

  const update = (id: string, patch: Partial<PaymentFormRow>) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <Card title="Payment schedule" subtitle="Percentages must add up to 100%.">
      <ul className="space-y-2">
        {rows.map((r, i) => (
          <li key={r.id} className="grid grid-cols-[1fr_84px_auto] items-center gap-2">
            <input
              className={inputClass}
              value={r.label}
              disabled={readOnly}
              onChange={(e) => update(r.id, { label: e.target.value })}
              aria-label="Payment name"
            />
            <div className="relative">
              <input
                className={`${inputClass} pr-7`}
                inputMode="decimal"
                value={r.percent}
                disabled={readOnly}
                onChange={(e) => update(r.id, { percent: e.target.value })}
                aria-label="Percent"
              />
              <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-sm text-stone-500">%</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                disabled={rows.length <= 1}
                onClick={() => onChange(rows.filter((x) => x.id !== r.id))}
                className="flex h-12 w-10 items-center justify-center rounded-xl text-stone-500 hover:bg-stone-100 disabled:opacity-30"
                aria-label="Remove payment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <p className="col-span-3 -mt-1 text-sm text-stone-600">
              {schedule.rows[i] ? formatINR(schedule.rows[i].amount) : "—"}
            </p>
          </li>
        ))}
      </ul>

      {!readOnly && (
        <button
          type="button"
          onClick={() => onChange([...rows, { id: `p${Date.now()}`, label: "Payment", percent: "0" }])}
          className="mt-3 flex h-11 items-center gap-2 rounded-xl border border-stone-300 px-3 text-sm font-medium text-stone-800"
        >
          <Plus className="h-4 w-4" /> Add payment
        </button>
      )}

      <p className={`mt-3 text-sm ${schedule.valid ? "text-emerald-800" : "text-red-600"}`}>
        {schedule.valid ? `Total 100% = ${formatINR(finalAmount)}` : (schedule.error ?? `Total ${formatNumber(schedule.totalPercent)}%`)}
      </p>
    </Card>
  );
}
