import type { PricingConfig } from "../types/calculator";

/**
 * ALL RATES LIVE HERE. Change a number, save, and the whole app updates.
 * Rates are in Indian rupees (INR).
 */
export const designPricing: PricingConfig = {
  currency: "INR",

  // --- Rates from the reference quotation ---
  architecture: 2.5, // per sqft  (architectural plan preparation)
  structural: 3, // per sqft
  electricalPlumbing: 3, // per sqft
  // Per front elevation design: G, G+1, G+2, G+3, G+4.
  // G+5 and above require an explicitly entered custom price.
  elevationRanges: [
    { min: 3000, max: 4000 },
    { min: 4000, max: 5000 },
    { min: 5000, max: 7000 },
    { min: 7000, max: 9000 },
    { min: 9000, max: 12000 },
  ],
  additionalFloor: 4, // per sqft (original quotation method)

  // --- Unique-design method ---
  architectureRepeatedPlan: 0, // repeated architectural plan: no charge by default
  architectureRevisedPlan: 2.5, // a copied plan that needs modification
  structuralRepeatedLayout: 0, // identical floor design: charged only once
  electricalPlumbingRepeatedLayout: 0, // identical floor design: charged only once
  additionalPhysicalFloorDesign: 4, // per sqft, only when the package is switched on
  siteRevision: 0, // per site-specific plan revision

  // When the additional-floor package is billed in unique-design mode,
  // these services are treated as already included for the covered floors.
  additionalFloorPackageIncludes: {
    architecture: true,
    structural: false,
    electricalPlumbing: false,
  },

  maxLevels: 9, // G+8
};

export const defaultPaymentSchedule = [
  { id: "advance", label: "Advance", percent: "50" },
  { id: "final", label: "Before final delivery", percent: "50" },
];
