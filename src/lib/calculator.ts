import { designPricing } from "./pricing-config";
import { buildingLabel, resolveFloors, shortFloorName } from "./floor-design";
import { formatINR, formatNumber } from "./format";
import type {
  CalculationResult,
  CalculatorInput,
  FloorResolved,
  LineItem,
  LineService,
  PricingConfig,
} from "../types/calculator";

/** Removes binary floating-point noise (0.1 × 3) without rounding real digits. */
const exact = (n: number) => Number(n.toPrecision(12));
const isPositive = (n: number) => Number.isFinite(n) && n > 0;
const sum = (xs: number[]) => exact(xs.reduce((a, b) => a + b, 0));
const names = (fs: FloorResolved[]) => fs.map((f) => shortFloorName(f.index)).join(", ");
const areaOf = (f: FloorResolved) => f.areaSqft;

const SERVICES: LineService[] = [
  "architecture",
  "structural",
  "electricalPlumbing",
  "elevation3D",
  "additionalFloor",
  "revision",
];

function zeroTotals(): Record<LineService, number> {
  return {
    architecture: 0,
    structural: 0,
    electricalPlumbing: 0,
    elevation3D: 0,
    additionalFloor: 0,
    revision: 0,
  };
}

function emptyResult(input: CalculatorInput, errors: string[]): CalculationResult {
  return {
    mode: input.mode,
    valid: false,
    errors,
    warnings: [],
    groundFloorArea: 0,
    levels: input.levels,
    buildingLabel: buildingLabel(input.levels),
    totalConstructedArea: 0,
    uniqueDesigns: 0,
    repeatedDesigns: 0,
    uniqueArchitecturalArea: 0,
    repeatedArchitecturalArea: 0,
    architectureBillingArea: 0,
    structuralArea: 0,
    electricalPlumbingArea: 0,
    floors: [],
    items: [],
    serviceTotals: zeroTotals(),
    subtotal: 0,
    discountAmount: 0,
    finalAmount: 0,
  };
}

function areaItem(
  id: string,
  service: LineService,
  label: string,
  areaSqft: number,
  rate: number,
  note?: string,
): LineItem {
  const amount = exact(areaSqft * rate);
  return {
    id,
    service,
    label,
    areaSqft,
    quantity: null,
    rate,
    amount,
    formula: `${formatNumber(areaSqft)} sqft × ${formatINR(rate)}/sqft = ${formatINR(amount)}`,
    note,
  };
}

function countItem(
  id: string,
  service: LineService,
  label: string,
  quantity: number,
  rate: number,
  note?: string,
): LineItem {
  const amount = exact(quantity * rate);
  return {
    id,
    service,
    label,
    areaSqft: null,
    quantity,
    rate,
    amount,
    formula: `${formatNumber(quantity)} × ${formatINR(rate)} = ${formatINR(amount)}`,
    note,
  };
}

export function calculate(
  input: CalculatorInput,
  config: PricingConfig = designPricing,
): CalculationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isPositive(input.length)) errors.push("Length must be a positive number (in feet).");
  if (!isPositive(input.width)) errors.push("Width must be a positive number (in feet).");
  if (!Number.isInteger(input.levels) || input.levels < 1 || input.levels > config.maxLevels) {
    errors.push(
      `Building configuration must be between G and ${buildingLabel(config.maxLevels)}.`,
    );
  }
  if (errors.length) return emptyResult(input, errors);

  const groundFloorArea = exact(input.length * input.width);
  const resolution = resolveFloors(input.floors, input.levels, groundFloorArea);
  errors.push(...resolution.errors);

  const s = input.services;
  const elevationRange = config.elevationRanges[input.levels - 1];
  const elevationRate = input.elevationRate ?? elevationRange?.min;
  if (s.elevation3D && (elevationRate === undefined || !isPositive(elevationRate))) {
    errors.push(elevationRate === undefined
      ? "G+5 and above require a custom 3D front elevation price."
      : "3D front elevation price must be a positive number.");
  }
  if (s.elevation3D && (!Number.isInteger(input.elevationCount) || input.elevationCount < 1)) {
    errors.push("Number of 3D elevation designs must be a whole number, at least 1.");
  }
  if (!Number.isInteger(input.siteRevisions) || input.siteRevisions < 0) {
    errors.push("Site revisions must be a whole number (0 or more).");
  }
  const basis = input.additionalFloor.basis;
  if (
    basis === "custom" &&
    !(Number.isFinite(input.additionalFloor.customAreaSqft) && input.additionalFloor.customAreaSqft >= 0)
  ) {
    errors.push("Additional-floor custom area must be zero or a positive number.");
  }
  const d = input.discount;
  if (!Number.isFinite(d.value) || d.value < 0) {
    errors.push("Discount must be zero or a positive number.");
  } else if (d.type === "percent" && d.value > 100) {
    errors.push("Percentage discount cannot be more than 100%.");
  }
  if (errors.length) return emptyResult(input, errors);

  const floors = resolution.floors;
  const totalArea = sum(floors.map(areaOf));
  const uniqueFloors = floors.filter((f) => f.isUnique);
  const repeatedFloors = floors.filter((f) => !f.isUnique);
  const uniqueArea = sum(uniqueFloors.map(areaOf));
  const repeatedArea = sum(repeatedFloors.map(areaOf));

  // Repeated floors whose area differs from the original plan
  for (const f of repeatedFloors) {
    const root = floors[f.designRoot];
    if (root.areaSqft !== f.areaSqft) {
      warnings.push(
        `${f.label} repeats ${root.label} but has a different area (${formatNumber(f.areaSqft)} vs ${formatNumber(root.areaSqft)} sqft). Consider marking it as a modified copy.`,
      );
    }
  }

  // ----- Additional-floor package -----
  const additionalFloors = floors.filter(
    (f) => f.index >= 2 && (input.mode === "original" || f.isUnique),
  );
  const additionalArea =
    basis === "second-floor-onward"
      ? sum(additionalFloors.map(areaOf))
      : basis === "custom"
        ? input.additionalFloor.customAreaSqft
        : 0;
  const packageBilled =
    basis !== "off" && (input.mode === "original" || input.applyAdditionalFloorInUniqueMode);
  const covered = new Set<number>();
  if (input.mode === "unique" && packageBilled && basis === "second-floor-onward") {
    additionalFloors.forEach((f) => covered.add(f.index));
  }

  const items: LineItem[] = [];

  if (input.mode === "original") {
    // ---------- Mode A: reference quotation ----------
    const n = floors.length;
    if (s.architecture) {
      items.push(
        areaItem("architecture", "architecture", `Architectural drawing – all ${n} floor(s)`, totalArea, config.architecture),
      );
    }
    if (s.structural) {
      items.push(
        areaItem("structural", "structural", `Structural design – all ${n} floor(s)`, totalArea, config.structural),
      );
    }
    if (s.electricalPlumbing) {
      items.push(
        areaItem(
          "electricalPlumbing",
          "electricalPlumbing",
          `Electrical & plumbing drawing – all ${n} floor(s)`,
          totalArea,
          config.electricalPlumbing,
        ),
      );
    }
  } else {
    // ---------- Mode B: unique design pricing ----------
    const packageIncludes = (k: "architecture" | "structural" | "electricalPlumbing") =>
      packageBilled && config.additionalFloorPackageIncludes[k];

    if (s.architecture) {
      const active = uniqueFloors.filter((f) => !(packageIncludes("architecture") && covered.has(f.index)));
      const newPlans = active.filter((f) => !f.modified);
      const revised = active.filter((f) => f.modified);
      if (newPlans.length) {
        items.push(
          areaItem(
            "arch-new",
            "architecture",
            `Architecture – ${newPlans.length} new plan(s): ${names(newPlans)}`,
            sum(newPlans.map(areaOf)),
            config.architecture,
          ),
        );
      }
      if (revised.length) {
        items.push(
          areaItem(
            "arch-revised",
            "architecture",
            `Architecture – ${revised.length} modified copy plan(s): ${names(revised)}`,
            sum(revised.map(areaOf)),
            config.architectureRevisedPlan,
            "Copied plan with changes, billed as a revised plan.",
          ),
        );
      }
      if (repeatedFloors.length) {
        const waived = repeatedFloors.filter(
          (f) => covered.has(f.index) && config.additionalFloorPackageIncludes.architecture,
        );
        const billable = repeatedFloors.filter((f) => !waived.includes(f));
        items.push(
          areaItem(
            "arch-repeat",
            "architecture",
            `Architecture – ${repeatedFloors.length} repeated plan(s): ${names(repeatedFloors)}`,
            sum(billable.map(areaOf)),
            config.architectureRepeatedPlan,
            waived.length
              ? `${names(waived)} covered by the additional-floor package.`
              : "Same plan as an earlier floor: no new plan charge.",
          ),
        );
      }
    }

    const layoutService = (
      service: "structural" | "electricalPlumbing",
      label: string,
      rateNew: number,
      rateRepeat: number,
    ) => {
      const waivedAll = packageIncludes(service);
      const active = floors.filter((f) => !(waivedAll && covered.has(f.index)));
      const uniq = active.filter((f) => f.isUnique);
      const rep = active.filter((f) => !f.isUnique);
      if (uniq.length) {
        items.push(
          areaItem(
            `${service}-unique`,
            service,
            `${label} – unique layouts: ${names(uniq)}`,
            sum(uniq.map(areaOf)),
            rateNew,
          ),
        );
      }
      if (rep.length) {
        items.push(
          areaItem(
            `${service}-repeat`,
            service,
            `${label} – repeated layouts: ${names(rep)}`,
            sum(rep.map(areaOf)),
            rateRepeat,
            rateRepeat === 0
              ? "Same design as an earlier floor: no additional charge."
              : "Repeated layout billed at the configured repeat rate.",
          ),
        );
        if (rateRepeat > 0) {
          warnings.push(
            `${names(rep)} reuse an existing design; the configured ${label.toLowerCase()} repeat rate is ${formatINR(rateRepeat)}/sqft.`,
          );
        }
      }
      if (waivedAll && covered.size) {
        warnings.push(
          `${label} for ${names(floors.filter((f) => covered.has(f.index)))} is treated as included in the additional-floor package.`,
        );
      }
    };

    if (s.structural) layoutService("structural", "Structural design", config.structural, config.structuralRepeatedLayout);
    if (s.electricalPlumbing) {
      layoutService(
        "electricalPlumbing",
        "Electrical & plumbing",
        config.electricalPlumbing,
        config.electricalPlumbingRepeatedLayout,
      );
    }
  }

  if (s.elevation3D) {
    items.push(countItem(
      "elevation3D",
      "elevation3D",
      `3D front elevation – ${buildingLabel(input.levels)}, ${input.elevationCount} design(s)`,
      input.elevationCount,
      elevationRate as number,
      input.elevationRate != null
        ? "Entered price, charged once per elevation design."
        : `Starting price for ${buildingLabel(input.levels)}. Suggested range: ${formatINR(elevationRange.min)}–${formatINR(elevationRange.max)} per design.`,
    ));
  }

  // ----- Additional-floor service (both modes) -----
  if (packageBilled && additionalArea > 0) {
    const rate = input.mode === "original" ? config.additionalFloor : config.additionalPhysicalFloorDesign;
    const label =
      basis === "second-floor-onward"
        ? `Additional floor service – floors from the second onward (${names(additionalFloors)})`
        : "Additional floor service – custom area";
    items.push(
      areaItem(
        "additional-floor",
        "additionalFloor",
        label,
        additionalArea,
        rate,
        basis === "second-floor-onward"
          ? input.mode === "unique"
            ? "Billed only for new or modified designs from the second floor onward; identical repeats are free."
            : "Convention: billed on the total area of every floor from the second floor onward."
          : "Area entered manually.",
      ),
    );
  }

  // ----- Site revisions -----
  if (input.siteRevisions > 0) {
    items.push(
      countItem("revision", "revision", "Site-specific plan revisions", input.siteRevisions, config.siteRevision),
    );
  }

  if (!items.length) warnings.push("No chargeable service is selected.");

  const serviceTotals = zeroTotals();
  for (const it of items) serviceTotals[it.service] = exact(serviceTotals[it.service] + it.amount);
  const areaFor = (service: LineService, skip?: (it: LineItem) => boolean) =>
    sum(items.filter((it) => it.service === service && it.areaSqft !== null && !skip?.(it)).map((it) => it.areaSqft as number));

  const subtotal = sum(items.map((it) => it.amount));
  const discountAmount =
    d.type === "percent" ? exact((subtotal * d.value) / 100) : exact(d.value);
  if (discountAmount > subtotal) {
    return emptyResult(input, ["Discount cannot be more than the subtotal."]);
  }

  return {
    mode: input.mode,
    valid: true,
    errors: [],
    warnings,
    groundFloorArea,
    levels: input.levels,
    buildingLabel: buildingLabel(input.levels),
    totalConstructedArea: totalArea,
    uniqueDesigns: uniqueFloors.length,
    repeatedDesigns: repeatedFloors.length,
    uniqueArchitecturalArea: uniqueArea,
    repeatedArchitecturalArea: repeatedArea,
    architectureBillingArea: s.architecture
      ? areaFor("architecture", (it) => it.id === "arch-repeat" && it.rate === 0)
      : 0,
    structuralArea: areaFor("structural", (it) => it.id === "structural-repeat" && it.rate === 0),
    electricalPlumbingArea: areaFor("electricalPlumbing", (it) => it.id === "electricalPlumbing-repeat" && it.rate === 0),
    floors,
    items,
    serviceTotals,
    subtotal,
    discountAmount,
    finalAmount: exact(subtotal - discountAmount),
  };
}

export const SERVICE_LABELS: Record<LineService, string> = {
  architecture: "Architectural drawing",
  structural: "Structural design",
  electricalPlumbing: "Electrical & plumbing",
  elevation3D: "3D elevation",
  additionalFloor: "Additional floor service",
  revision: "Site revisions",
};

export { SERVICES };
