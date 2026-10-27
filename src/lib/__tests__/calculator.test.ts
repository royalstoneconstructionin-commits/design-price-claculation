import { describe, expect, it } from "vitest";
import { calculate } from "../calculator";
import { designPricing } from "../pricing-config";
import { emptyFloor, findCircularReference } from "../floor-design";
import { formatINR } from "../format";
import { computePaymentSchedule } from "../quotation";
import type { CalculatorInput, FloorInput } from "../../types/calculator";

/** Build 9 floors; `refs` maps floor index -> index of the floor it repeats. */
function floorsWith(refs: Record<number, number> = {}, extra: Record<number, Partial<FloorInput>> = {}): FloorInput[] {
  return Array.from({ length: 9 }, (_, i) => ({
    ...emptyFloor(),
    designRef: refs[i] ?? null,
    ...(extra[i] ?? {}),
  }));
}

function input(over: Partial<CalculatorInput> = {}): CalculatorInput {
  return {
    length: 30,
    width: 40,
    levels: 2,
    floors: floorsWith(),
    services: { architecture: true, structural: true, electricalPlumbing: true, elevation3D: true },
    mode: "unique",
    elevationCount: 1,
    elevationRate: 7000,
    additionalFloor: { basis: "off", customAreaSqft: 0 },
    applyAdditionalFloorInUniqueMode: false,
    siteRevisions: 0,
    discount: { type: "fixed", value: 0 },
    ...over,
  };
}

describe("floor and design counting", () => {
  it("1. G with one new design", () => {
    const r = calculate(input({ levels: 1 }));
    expect(r.valid).toBe(true);
    expect(r.groundFloorArea).toBe(1200);
    expect(r.totalConstructedArea).toBe(1200);
    expect(r.uniqueDesigns).toBe(1);
    expect(r.repeatedDesigns).toBe(0);
    expect(r.buildingLabel).toBe("G");
    expect(r.serviceTotals.architecture).toBe(3000);
  });

  it("2. G+1 with two unique designs", () => {
    const r = calculate(input({ levels: 2 }));
    expect(r.uniqueDesigns).toBe(2);
    expect(r.repeatedDesigns).toBe(0);
    expect(r.totalConstructedArea).toBe(2400);
    expect(r.serviceTotals.architecture).toBe(6000);
  });

  it("3. G+2 with second floor repeating first", () => {
    const r = calculate(input({ levels: 3, floors: floorsWith({ 2: 1 }) }));
    expect(r.uniqueDesigns).toBe(2);
    expect(r.repeatedDesigns).toBe(1);
    expect(r.totalConstructedArea).toBe(3600);
    expect(r.serviceTotals.architecture).toBe(6000);
    expect(r.serviceTotals.structural).toBe(7200);
    expect(r.serviceTotals.electricalPlumbing).toBe(7200);
    expect(r.finalAmount).toBe(calculate(input({ levels: 2 })).finalAmount);
    const original = calculate(input({ levels: 3, floors: floorsWith({ 2: 1 }), mode: "original" }));
    expect(original.serviceTotals.architecture).toBe(9000);
  });

  it("4. G+3 with second and third floors repeating first (the key business rule)", () => {
    const r = calculate(input({ levels: 4, floors: floorsWith({ 2: 1, 3: 1 }) }));
    expect(r.levels).toBe(4);
    expect(r.totalConstructedArea).toBe(4800);
    expect(r.uniqueDesigns).toBe(2);
    expect(r.repeatedDesigns).toBe(2);
    expect(r.uniqueArchitecturalArea).toBe(2400);
    expect(r.repeatedArchitecturalArea).toBe(2400);
    expect(r.architectureBillingArea).toBe(2400);
    expect(r.serviceTotals.architecture).toBe(6000);
    // All floor design services charge each distinct design only once.
    expect(r.structuralArea).toBe(2400);
    expect(r.electricalPlumbingArea).toBe(2400);
    expect(r.serviceTotals.structural).toBe(7200);
    expect(r.serviceTotals.electricalPlumbing).toBe(7200);
    expect(r.finalAmount).toBe(27400);
  });

  it("5. G+8 with all floors after the first repeating the first", () => {
    const refs: Record<number, number> = {};
    for (let i = 2; i <= 8; i++) refs[i] = 1;
    const r = calculate(input({ levels: 9, floors: floorsWith(refs) }));
    expect(r.totalConstructedArea).toBe(10800);
    expect(r.uniqueDesigns).toBe(2);
    expect(r.repeatedDesigns).toBe(7);
    expect(r.serviceTotals.architecture).toBe(6000);
    expect(r.structuralArea).toBe(2400);
  });

  it("6. G+8 with every floor unique", () => {
    const r = calculate(input({ levels: 9 }));
    expect(r.uniqueDesigns).toBe(9);
    expect(r.repeatedDesigns).toBe(0);
    expect(r.serviceTotals.architecture).toBe(10800 * 2.5);
    const original = calculate(input({ levels: 9, mode: "original" }));
    expect(original.serviceTotals.architecture).toBe(r.serviceTotals.architecture);
  });

  it("7. a floor repeating another repeated floor resolves to the original", () => {
    const r = calculate(input({ levels: 4, floors: floorsWith({ 2: 1, 3: 2 }) }));
    expect(r.floors[3].designRoot).toBe(1);
    expect(r.floors[3].rootLabel).toBe("First Floor");
    expect(r.uniqueDesigns).toBe(2);
    expect(r.repeatedDesigns).toBe(2);
    expect(r.finalAmount).toBe(27400);
  });

  it("modified copy is billed as a revised plan and counts as unique", () => {
    const r = calculate(input({ levels: 3, floors: floorsWith({ 2: 1 }, { 2: { modified: true } }) }));
    expect(r.uniqueDesigns).toBe(3);
    expect(r.repeatedDesigns).toBe(0);
    expect(r.serviceTotals.architecture).toBe(3600 * 2.5);
    expect(r.serviceTotals.structural).toBe(3600 * 3);
    expect(r.serviceTotals.electricalPlumbing).toBe(3600 * 3);
  });
});

describe("areas", () => {
  it("8. different built-up areas on different floors", () => {
    const r = calculate(
      input({ levels: 3, floors: floorsWith({ 2: 1 }, { 1: { areaOverride: 800 }, 2: { areaOverride: 800 } }) }),
    );
    expect(r.totalConstructedArea).toBe(1200 + 800 + 800);
    expect(r.uniqueArchitecturalArea).toBe(1200 + 800);
    expect(r.repeatedArchitecturalArea).toBe(800);
    expect(r.serviceTotals.architecture).toBe(2000 * 2.5);
    expect(r.structuralArea).toBe(2000);
    expect(r.electricalPlumbingArea).toBe(2000);
  });
});

describe("services and discounts", () => {
  it("9. services can be enabled and disabled independently", () => {
    const all = calculate(input());
    const noElev = calculate(
      input({ services: { architecture: true, structural: true, electricalPlumbing: true, elevation3D: false } }),
    );
    expect(noElev.serviceTotals.elevation3D).toBe(0);
    expect(noElev.finalAmount).toBe(all.finalAmount - 7000);

    const onlyStruct = calculate(
      input({ services: { architecture: false, structural: true, electricalPlumbing: false, elevation3D: false } }),
    );
    expect(onlyStruct.finalAmount).toBe(7200);
    expect(onlyStruct.architectureBillingArea).toBe(0);
    expect(onlyStruct.items.every((i) => i.service === "structural")).toBe(true);

    const none = calculate(
      input({ services: { architecture: false, structural: false, electricalPlumbing: false, elevation3D: false } }),
    );
    expect(none.finalAmount).toBe(0);
    expect(none.warnings.join(" ")).toMatch(/No chargeable service/);
  });

  it("10. fixed and percentage discounts", () => {
    const fixed = calculate(input({ discount: { type: "fixed", value: 1200 } }));
    expect(fixed.subtotal).toBe(27400);
    expect(fixed.finalAmount).toBe(26200);

    const pct = calculate(input({ discount: { type: "percent", value: 10 } }));
    expect(pct.discountAmount).toBe(2740);
    expect(pct.finalAmount).toBe(24660);

    expect(calculate(input({ discount: { type: "percent", value: 150 } })).valid).toBe(false);
    expect(calculate(input({ discount: { type: "fixed", value: -5 } })).valid).toBe(false);
    expect(calculate(input({ discount: { type: "fixed", value: 99999 } })).valid).toBe(false);
  });

  it("11. G+1 on 1200 sqft with an entered ₹7,000 elevation price = ₹27,400 in both methods", () => {
    for (const mode of ["original", "unique"] as const) {
      const r = calculate(input({ mode }));
      expect(r.serviceTotals.architecture).toBe(6000);
      expect(r.serviceTotals.structural).toBe(7200);
      expect(r.serviceTotals.electricalPlumbing).toBe(7200);
      expect(r.serviceTotals.elevation3D).toBe(7000);
      expect(r.subtotal).toBe(27400);
    }
  });

  it("elevation count is charged per design in unique mode", () => {
    const r = calculate(input({ elevationCount: 2 }));
    expect(r.serviceTotals.elevation3D).toBe(14000);
    expect(calculate(input({ elevationCount: 0 })).valid).toBe(false);
  });
});

describe("building-based front elevation pricing", () => {
  for (const mode of ["original", "unique"] as const) {
    it.each([
      [1, 3000], [2, 4000], [3, 5000], [4, 7000], [5, 9000],
    ])(`${mode}: %i levels uses the starting price of %i`, (levels, rate) => {
      const r = calculate(input({ mode, levels, elevationRate: null }));
      expect(r.valid).toBe(true);
      expect(r.serviceTotals.elevation3D).toBe(rate);
      expect(r.items.find((i) => i.service === "elevation3D")?.rate).toBe(rate);
    });

    it(`${mode}: entered price is charged once per elevation design`, () => {
      const r = calculate(input({ mode, levels: 3, elevationRate: 6500, elevationCount: 2 }));
      expect(r.valid).toBe(true);
      expect(r.serviceTotals.elevation3D).toBe(13000);
    });
  }

  it.each([6, 7, 8, 9])("%i levels requires a custom price when elevation is selected", (levels) => {
    const missing = calculate(input({ levels, elevationRate: null }));
    expect(missing.valid).toBe(false);
    expect(missing.errors.join(" ")).toMatch(/custom 3D front elevation price/);
    const custom = calculate(input({ levels, elevationRate: 15000 }));
    expect(custom.valid).toBe(true);
    expect(custom.serviceTotals.elevation3D).toBe(15000);
  });

  it.each([0, -100, NaN, Infinity])("rejects invalid entered price %s", (elevationRate) => {
    expect(calculate(input({ elevationRate })).valid).toBe(false);
  });

  it("does not require a custom price when elevation is turned off", () => {
    const r = calculate(input({
      levels: 9,
      elevationRate: null,
      services: { architecture: true, structural: true, electricalPlumbing: true, elevation3D: false },
    }));
    expect(r.valid).toBe(true);
    expect(r.serviceTotals.elevation3D).toBe(0);
  });

  it("bases elevation on building height even when all higher floors repeat", () => {
    const r = calculate(input({ levels: 5, elevationRate: null, floors: floorsWith({ 2: 1, 3: 1, 4: 1 }) }));
    expect(r.uniqueDesigns).toBe(2);
    expect(r.serviceTotals.elevation3D).toBe(9000);
  });
});

describe("validation", () => {
  it("12. invalid reference and area inputs", () => {
    // 2nd floor cannot use the design of the 4th floor
    const forward = calculate(input({ levels: 5, floors: floorsWith({ 2: 4 }) }));
    expect(forward.valid).toBe(false);
    expect(forward.errors.join(" ")).toMatch(/only earlier floors/);

    // circular
    expect(findCircularReference(floorsWith({ 2: 3, 3: 2 }), 4)).not.toBeNull();
    expect(calculate(input({ levels: 4, floors: floorsWith({ 2: 3, 3: 2 }) })).valid).toBe(false);

    // first floor must be new
    expect(calculate(input({ floors: floorsWith({ 1: 0 }) })).valid).toBe(false);

    // bad numbers
    expect(calculate(input({ length: 0 })).valid).toBe(false);
    expect(calculate(input({ width: -5 })).valid).toBe(false);
    expect(calculate(input({ length: NaN })).valid).toBe(false);
    expect(calculate(input({ levels: 10 })).valid).toBe(false);
    expect(calculate(input({ levels: 0 })).valid).toBe(false);
    expect(calculate(input({ floors: floorsWith({}, { 1: { areaOverride: -100 } }) })).valid).toBe(false);
    expect(calculate(input({ floors: floorsWith({}, { 1: { areaOverride: NaN } }) })).valid).toBe(false);
  });
});

describe("repeated plans and additional floors", () => {
  it("13. identical repeated designs have no additional service charges", () => {
    const r = calculate(input({ levels: 4, floors: floorsWith({ 2: 1, 3: 1 }) }));
    const rep = r.items.find((i) => i.id === "structural-repeat");
    expect(rep).toBeDefined();
    expect(rep?.areaSqft).toBe(2400);
    expect(rep?.amount).toBe(0);
    expect(r.items.find((i) => i.id === "electricalPlumbing-repeat")?.amount).toBe(0);
    expect(r.warnings).toEqual([]);
    // repeated architecture is ₹0 by default
    const archRepeat = r.items.find((i) => i.id === "arch-repeat");
    expect(archRepeat?.amount).toBe(0);
    expect(designPricing.architectureRepeatedPlan).toBe(0);
  });

  it("14. additional-floor charges without double billing", () => {
    const floors = floorsWith({ 2: 1, 3: 1 });
    const config = { ...designPricing, architectureRepeatedPlan: 1 };

    // Package off: repeated architecture is billed at the configured rate
    const off = calculate(input({ levels: 4, floors }), config);
    expect(off.items.find((i) => i.id === "arch-repeat")?.amount).toBe(2400);
    expect(off.serviceTotals.additionalFloor).toBe(0);

    // Package on: identical repeats are excluded from the additional-floor charge.
    const on = calculate(
      input({
        levels: 4,
        floors,
        applyAdditionalFloorInUniqueMode: true,
        additionalFloor: { basis: "second-floor-onward", customAreaSqft: 0 },
      }),
      config,
    );
    expect(on.serviceTotals.additionalFloor).toBe(0);
    expect(on.finalAmount).toBe(off.finalAmount);

    // Package that also includes structural: covered floors are not billed structurally again
    const includesStructural = {
      ...config,
      additionalFloorPackageIncludes: { architecture: true, structural: true, electricalPlumbing: false },
    };
    const inc = calculate(
      input({
        levels: 4,
        floors,
        applyAdditionalFloorInUniqueMode: true,
        additionalFloor: { basis: "second-floor-onward", customAreaSqft: 0 },
      }),
      includesStructural,
    );
    expect(inc.structuralArea).toBe(2400);
    expect(inc.serviceTotals.structural).toBe(7200);
  });

  it("additional-floor packages charge a new design once and exclude its repeated copies", () => {
    const r = calculate(
      input({
        levels: 5,
        floors: floorsWith({ 3: 2, 4: 3 }),
        applyAdditionalFloorInUniqueMode: true,
        additionalFloor: { basis: "second-floor-onward", customAreaSqft: 0 },
      }),
      {
        ...designPricing,
        additionalFloorPackageIncludes: { architecture: true, structural: true, electricalPlumbing: true },
      },
    );
    expect(r.valid).toBe(true);
    expect(r.totalConstructedArea).toBe(6000);
    expect(r.uniqueDesigns).toBe(3);
    expect(r.serviceTotals.additionalFloor).toBe(1200 * 4);
    expect(r.serviceTotals.architecture).toBe(6000);
    expect(r.serviceTotals.structural).toBe(7200);
    expect(r.serviceTotals.electricalPlumbing).toBe(7200);
    expect(r.finalAmount).toBe(27400 + 4800);
  });

  it("a repeated modified design is charged only for the original revision", () => {
    const r = calculate(input({
      levels: 5,
      floors: floorsWith({ 2: 1, 3: 2, 4: 3 }, { 2: { modified: true } }),
    }));
    expect(r.uniqueDesigns).toBe(3);
    expect(r.floors[4].designRoot).toBe(2);
    expect(r.finalAmount).toBe(3600 * (2.5 + 3 + 3) + 7000);
  });

  it("original method adds the additional floor service separately (G+1 has none by default convention)", () => {
    const g1 = calculate(input({ mode: "original", additionalFloor: { basis: "second-floor-onward", customAreaSqft: 0 } }));
    expect(g1.serviceTotals.additionalFloor).toBe(0);
    expect(g1.subtotal).toBe(27400);

    const g3 = calculate(
      input({ mode: "original", levels: 4, additionalFloor: { basis: "second-floor-onward", customAreaSqft: 0 } }),
    );
    expect(g3.serviceTotals.additionalFloor).toBe(2400 * 4);

    // the PDF's own figure: ₹4 × 2400 via an explicit custom basis
    const custom = calculate(input({ mode: "original", additionalFloor: { basis: "custom", customAreaSqft: 2400 } }));
    expect(custom.serviceTotals.additionalFloor).toBe(9600);
    expect(custom.subtotal).toBe(27400 + 9600);
  });
});

describe("formatting and payments", () => {
  it("formats Indian rupees", () => {
    expect(formatINR(31000)).toBe("₹31,000");
    expect(formatINR(123456.5)).toBe("₹1,23,456.5");
  });

  it("splits payments and requires 100%", () => {
    const ok = computePaymentSchedule(
      [
        { id: "a", label: "Advance", percent: "50" },
        { id: "b", label: "Final", percent: "50" },
      ],
      31000,
    );
    expect(ok.valid).toBe(true);
    expect(ok.rows.map((r) => r.amount)).toEqual([15500, 15500]);

    const bad = computePaymentSchedule(
      [
        { id: "a", label: "Advance", percent: "50" },
        { id: "b", label: "Final", percent: "40" },
      ],
      31000,
    );
    expect(bad.valid).toBe(false);
    expect(computePaymentSchedule([{ id: "a", label: "x", percent: "abc" }], 100).valid).toBe(false);
  });
});
