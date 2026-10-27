export type PricingMode = "original" | "unique";
export type DiscountType = "fixed" | "percent";
export type ServiceKey = "architecture" | "structural" | "electricalPlumbing" | "elevation3D";
export type LineService = ServiceKey | "additionalFloor" | "revision";
export type AdditionalFloorBasis = "second-floor-onward" | "custom" | "off";

export interface Services {
  architecture: boolean;
  structural: boolean;
  electricalPlumbing: boolean;
  elevation3D: boolean;
}

/** One physical floor as entered by the user (numbers already parsed). */
export interface FloorInput {
  /** null = use the ground-floor footprint. */
  areaOverride: number | null;
  /** null = new design, otherwise index of an earlier floor whose design is repeated. */
  designRef: number | null;
  /** A copy that needs changes: billed as a revised plan instead of a repeat. */
  modified: boolean;
}

export interface CalculatorInput {
  length: number;
  width: number;
  /** Number of physical levels: 1 = G, 2 = G+1 ... 9 = G+8. */
  levels: number;
  floors: FloorInput[];
  services: Services;
  mode: PricingMode;
  elevationCount: number;
  /** null/undefined uses the starting price for the building type. Required for G+5 and above. */
  elevationRate?: number | null;
  additionalFloor: { basis: AdditionalFloorBasis; customAreaSqft: number };
  /** Unique-design mode only: bill the additional-floor package. */
  applyAdditionalFloorInUniqueMode: boolean;
  siteRevisions: number;
  discount: { type: DiscountType; value: number };
}

export interface PricingConfig {
  currency: "INR";
  // Rates from the reference quotation
  architecture: number;
  structural: number;
  electricalPlumbing: number;
  elevationRanges: { min: number; max: number }[];
  additionalFloor: number;
  // Unique-design mode rates
  architectureRepeatedPlan: number;
  architectureRevisedPlan: number;
  structuralRepeatedLayout: number;
  electricalPlumbingRepeatedLayout: number;
  additionalPhysicalFloorDesign: number;
  siteRevision: number;
  /** Services treated as already included when the additional-floor package is billed (unique mode). */
  additionalFloorPackageIncludes: {
    architecture: boolean;
    structural: boolean;
    electricalPlumbing: boolean;
  };
  maxLevels: number;
}

export interface FloorResolved {
  index: number;
  label: string;
  areaSqft: number;
  /** Index of the original design this floor resolves to. */
  designRoot: number;
  rootLabel: string;
  isUnique: boolean;
  refersTo: number | null;
  modified: boolean;
}

export interface LineItem {
  id: string;
  service: LineService;
  label: string;
  areaSqft: number | null;
  quantity: number | null;
  rate: number;
  amount: number;
  formula: string;
  note?: string;
}

export interface CalculationResult {
  mode: PricingMode;
  valid: boolean;
  errors: string[];
  warnings: string[];
  groundFloorArea: number;
  levels: number;
  buildingLabel: string;
  totalConstructedArea: number;
  uniqueDesigns: number;
  repeatedDesigns: number;
  uniqueArchitecturalArea: number;
  repeatedArchitecturalArea: number;
  architectureBillingArea: number;
  structuralArea: number;
  electricalPlumbingArea: number;
  floors: FloorResolved[];
  items: LineItem[];
  serviceTotals: Record<LineService, number>;
  subtotal: number;
  discountAmount: number;
  finalAmount: number;
}

/* ---------- Form (UI) state: raw strings from inputs ---------- */

export interface FloorFormState {
  areaOverride: string;
  designRef: number | null;
  modified: boolean;
}

export interface PaymentFormRow {
  id: string;
  label: string;
  percent: string;
}

export interface FormState {
  length: string;
  width: string;
  levels: number;
  advancedAreas: boolean;
  floors: FloorFormState[];
  services: Services;
  mode: PricingMode;
  elevationCount: string;
  elevationRate: string;
  additionalFloorBasis: AdditionalFloorBasis;
  additionalFloorCustomArea: string;
  additionalFloorInUnique: boolean;
  siteRevisions: string;
  discountType: DiscountType;
  discountValue: string;
  payments: PaymentFormRow[];
}
