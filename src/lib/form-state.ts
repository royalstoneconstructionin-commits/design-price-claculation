import { defaultPaymentSchedule, designPricing } from "./pricing-config";
import { parseNumber } from "./format";
import type { CalculatorInput, FloorFormState, FormState } from "../types/calculator";

export const FORM_STORAGE_KEY = "bdc.form.v1";

const emptyFloorForm = (): FloorFormState => ({ areaOverride: "", designRef: null, modified: false });

export const defaultForm: FormState = {
  length: "30",
  width: "40",
  levels: 2,
  advancedAreas: false,
  floors: Array.from({ length: designPricing.maxLevels }, emptyFloorForm),
  services: { architecture: true, structural: true, electricalPlumbing: true, elevation3D: true },
  mode: "unique",
  elevationCount: "1",
  elevationRate: "",
  additionalFloorBasis: "second-floor-onward",
  additionalFloorCustomArea: "0",
  additionalFloorInUnique: false,
  siteRevisions: "0",
  discountType: "fixed",
  discountValue: "0",
  payments: defaultPaymentSchedule.map((p) => ({ ...p })),
};

/** Safely merges whatever was saved in the browser over the defaults. */
export function mergeForm(stored: unknown, initial: FormState): FormState {
  if (!stored || typeof stored !== "object") return initial;
  const merged = { ...initial, ...(stored as Partial<FormState>) } as FormState;
  if (!Array.isArray(merged.floors) || merged.floors.length !== designPricing.maxLevels) {
    merged.floors = initial.floors;
  }
  if (!Array.isArray(merged.payments) || merged.payments.length === 0) {
    merged.payments = initial.payments;
  }
  merged.services = { ...initial.services, ...(merged.services ?? {}) };
  return merged;
}

export function toCalculatorInput(f: FormState): CalculatorInput {
  const blank = (s: string) => s.trim() === "";
  return {
    length: parseNumber(f.length),
    width: parseNumber(f.width),
    levels: f.levels,
    floors: f.floors.map((fl, i) => ({
      areaOverride: f.advancedAreas && i > 0 && !blank(fl.areaOverride) ? parseNumber(fl.areaOverride) : null,
      designRef: i < 2 ? null : fl.designRef,
      modified: i >= 2 && fl.designRef !== null && fl.modified,
    })),
    services: f.services,
    mode: f.mode,
    elevationCount: parseNumber(f.elevationCount),
    elevationRate: blank(f.elevationRate) ? null : parseNumber(f.elevationRate),
    additionalFloor: {
      basis: f.additionalFloorBasis,
      customAreaSqft: f.additionalFloorBasis === "custom" ? parseNumber(f.additionalFloorCustomArea) : 0,
    },
    applyAdditionalFloorInUniqueMode: f.additionalFloorInUnique,
    siteRevisions: blank(f.siteRevisions) ? 0 : parseNumber(f.siteRevisions),
    discount: { type: f.discountType, value: blank(f.discountValue) ? 0 : parseNumber(f.discountValue) },
  };
}
