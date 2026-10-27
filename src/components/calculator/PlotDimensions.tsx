import { Card, Field, inputClass } from "@/components/ui";
import { formatSqft, parseNumber } from "@/lib/format";

interface Props {
  length: string;
  width: string;
  onChange: (patch: { length?: string; width?: string }) => void;
}

function check(value: string): string | null {
  const n = parseNumber(value);
  return Number.isFinite(n) && n > 0 ? null : "Enter a number greater than 0.";
}

export default function PlotDimensions({ length, width, onChange }: Props) {
  const l = parseNumber(length);
  const w = parseNumber(width);
  const area = l > 0 && w > 0 ? l * w : null;

  return (
    <Card title="1. Plot size" subtitle="Enter the plot size in feet.">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Length (ft)" error={check(length)}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={length}
            onChange={(e) => onChange({ length: e.target.value })}
            placeholder="30"
          />
        </Field>
        <Field label="Width (ft)" error={check(width)}>
          <input
            className={inputClass}
            inputMode="decimal"
            value={width}
            onChange={(e) => onChange({ width: e.target.value })}
            placeholder="40"
          />
        </Field>
      </div>
      <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
        Ground floor area:{" "}
        <strong>{area !== null ? formatSqft(area) : "—"}</strong>
      </p>
    </Card>
  );
}
