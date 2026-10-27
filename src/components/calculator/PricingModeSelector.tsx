import { Card } from "@/components/ui";
import type { PricingMode } from "@/types/calculator";

interface Props {
  mode: PricingMode;
  onChange: (mode: PricingMode) => void;
}

const MODES: { id: PricingMode; title: string; text: string }[] = [
  {
    id: "unique",
    title: "Unique Design",
    text: "Charge once per distinct floor design for architecture, structure, electrical and plumbing. Identical repeated floors have no additional design charge.",
  },
  {
    id: "original",
    title: "Original Quotation",
    text: "Every rate is applied to the total area of all floors, as in the reference quotation.",
  },
];

export default function PricingModeSelector({ mode, onChange }: Props) {
  return (
    <Card title="5. Pricing method">
      <div className="grid gap-2 sm:grid-cols-2">
        {MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-pressed={active}
              className={`rounded-xl border p-3 text-left transition ${
                active ? "border-emerald-700 bg-emerald-50" : "border-stone-300 bg-white"
              }`}
            >
              <span className="block text-sm font-semibold text-stone-900">{m.title}</span>
              <span className="mt-1 block text-xs text-stone-600">{m.text}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
