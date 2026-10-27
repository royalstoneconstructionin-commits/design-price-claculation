import { Card } from "@/components/ui";
import { buildingLabel } from "@/lib/floor-design";
import { designPricing } from "@/lib/pricing-config";

interface Props {
  levels: number;
  onChange: (levels: number) => void;
}

export default function BuildingFloorSelector({ levels, onChange }: Props) {
  const options = Array.from({ length: designPricing.maxLevels }, (_, i) => i + 1);
  return (
    <Card title="2. Building type" subtitle="G = ground floor only. G+2 = ground plus 2 floors.">
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {options.map((n) => {
          const active = n === levels;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              aria-pressed={active}
              className={`h-12 rounded-xl border text-base font-semibold transition ${
                active
                  ? "border-emerald-700 bg-emerald-700 text-white shadow"
                  : "border-stone-300 bg-white text-stone-800 hover:border-emerald-600"
              }`}
            >
              {buildingLabel(n)}
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-stone-600">
        {levels} physical floor{levels > 1 ? "s" : ""}
      </p>
    </Card>
  );
}
