import { branding } from "./branding";
import { formatINR, formatNumber, parseNumber } from "./format";
import { addDaysISO, formatDateText, type ClientDetails } from "./quotation";

export const constructionPackages = [
  { id: "silver", name: "Silver", rate: 1800 },
  { id: "gold", name: "Gold", rate: 2000 },
  { id: "platinum", name: "Platinum", rate: 2300 },
] as const;
export type PackageId = (typeof constructionPackages)[number]["id"];
type Feature = { label: string; values: [string, string, string] };
export const constructionFeatures: { title: string; note?: string; rows: Feature[] }[] = [
  { title: "Design & Planning", rows: [
    { label: "Design & Consultation", values: ["Free", "Free", "Free"] },
    { label: "Drawings", values: ["2D Floor Plan & 3D Elevation", "2D Floor Plan & 3D Elevation", "2D Floor Plan & 3D Elevation"] },
    { label: "Structural Design", values: ["To be confirmed", "To be confirmed", "To be confirmed"] },
  ] },
  { title: "Structure", rows: [
    { label: "Steel", values: ["Kamdhenu / Sail", "Jindal / JSW", "TATA Tiscon / Jindal"] },
    { label: "Cement", values: ["Ultratech", "ACC / Ultratech", "ACC / Ultratech / Concreto"] },
    { label: "20mm Aggregate", values: ["Gaya / Koderma", "Gaya / Koderma", "Gaya / Koderma"] },
    { label: "Bricks", values: ["A1 Quality", "A1 Quality", "A1 Quality"] },
    { label: "RCC Mix", values: ["M20", "M20", "M20"] },
    { label: "Ceiling height", values: ["To be confirmed", "To be confirmed", "To be confirmed"] },
  ] },
  { title: "Kitchen", note: "All fittings can be customised at extra cost.", rows: [
    { label: "Ceramic Wall Dado", values: ["Up to ₹40 per sqft", "Up to ₹60 per sqft", "Up to ₹80 per sqft"] },
    { label: "Sink", values: ["Up to ₹3,000 (Futura, Carysil)", "Up to ₹6,000 (Futura, Carysil)", "Up to ₹6,000 (Futura, Carysil)"] },
    { label: "Sink Faucet", values: ["Up to ₹1,000", "Up to ₹2,000", "Up to ₹2,000"] },
    { label: "Sink Accessories", values: ["Parryware", "Parryware / Hindware", "Parryware / Hindware / Jaquar"] },
  ] },
  { title: "Bathroom", note: "All fittings can be customised at extra cost.", rows: [
    { label: "Ceramic Wall Dado", values: ["Up to ₹30 per sqft", "Up to ₹40 per sqft", "Up to ₹50 per sqft"] },
    { label: "Sanitary & CP fittings", values: ["Up to ₹30,000 per 1000 sqft (Parryware)", "Up to ₹40,000 per 1000 sqft (Parryware / Hindware)", "Up to ₹50,000 per 1000 sqft (Parryware / Hindware / Jaguar)"] },
    { label: "CPVC Pipe", values: ["Prince", "Supreme", "Supreme / Ashirvad"] },
    { label: "Bathroom doors", values: ["Aluminium", "UPVC / WPC", "UPVC / WPC"] },
  ] },
  { title: "Doors & Windows", rows: [
    { label: "Main Door", values: ["Iron Door up to ₹30,000 including accessories", "Stainless Steel up to ₹40,000 including accessories", "Stainless Steel / Teak Wood ₹50,000 including accessories"] },
    { label: "Internal Doors", values: ["MR Ply Board Waterproof With Laminates up to ₹10,000", "Century Ply Board Waterproof With Laminates up to ₹11,000", "Green/Century Ply Board Waterproof With Laminates up to ₹13,000"] },
    { label: "Puja Room Door", values: ["WPC with frame worth ₹4,000 for every Puja Room", "WPC with frame worth ₹5,000 for every Puja Room", "WPC with frame worth ₹6,000 for every Puja Room"] },
    { label: "Windows", values: ["Aluminium windows ₹300 per sqft", "UPVC windows ₹400 per sqft", "UPVC windows ₹500 per sqft"] },
    { label: "Window grills", values: ["No", "Yes", "Yes"] },
  ] },
  { title: "Painting", rows: [
    { label: "Interior Painting (Asian Paints): JK Putty + Primer + Emulsion Paint", values: ["Tractor Shyne Emulsion", "Tractor Shyne Emulsion", "Royale Luxury Emulsion"] },
    { label: "Exterior Painting (Asian Paints): Primer + Exterior Emulsion", values: ["Apex Exterior Emulsion", "Apex Exterior Emulsion", "Apex Ultima Exterior Emulsion"] },
  ] },
  { title: "Flooring", note: "Laying charges will vary for marble tiles and granite.", rows: [
    ...["Living & Dining Flooring", "Rooms and Kitchen Flooring", "Balcony and Open Area"].map((label): Feature => ({ label, values: ["Varmora / Kajaria up to ₹60 per sqft", "Kajaria / Johnson up to ₹80 per sqft", "Kajaria / Johnson / Somany up to ₹100 per sqft"] })),
    { label: "Staircase", values: ["Up to ₹60 per sqft", "Up to ₹70 per sqft", "Up to ₹80 per sqft"] },
    { label: "Parking", values: ["Tiles up to ₹40 per sqft", "Tiles up to ₹70 per sqft", "Tiles up to ₹70 per sqft"] },
  ] },
  { title: "Wiring", rows: [
    ...["Fire proof Wiring", "Switch", "Socket"].map((label): Feature => ({ label, values: ["Anchor", "Anchor / Polycab", "Anchor / Polycab / Havells"] })),
    { label: "Provision for UPS Wiring", values: ["Malhotra", "Malhotra / Anchor", "Anchor / Polycab"] },
  ] },
  { title: "Others", rows: [
    { label: "Borewell / Double layered water tank", values: ["1500 Ltrs. Apollo / equivalent make", "2000 Ltrs. Sintex / equivalent make", "2000 Ltrs. Sintex / equivalent make"] },
    { label: "Septic Tank", values: ["800 Ltrs.", "1000 Ltrs.", "12000 Ltrs."] },
    { label: "Staircase railing", values: ["MS Railing", "SS 304 grade Railing", "SS 304 grade Railing with glass"] },
    { label: "Mumty (additional)", values: ["₹1,200 per sqft", "₹1,200 per sqft", "₹1,200 per sqft"] },
    { label: "Brick Parapet Wall (4 inch, additional)", values: ["Material + Labour: ₹240 per sqft", "Material + Labour: ₹240 per sqft", "Material + Labour: ₹240 per sqft"] },
    { label: "Basement / Raft Foundation (additional)", values: ["RCC 6 inch: ₹400 per sqft", "RCC 8 inch: ₹500 per sqft", "RCC 10 inch: ₹640 per sqft"] },
  ] },
];

export const defaultConstructionForm = { length: "", width: "", floors: "1", packageId: "silver" as PackageId, mumty: "0", parapet: "0", foundation: "0" };
export type ConstructionForm = typeof defaultConstructionForm;
export function mergeConstructionForm(stored: unknown, initial: ConstructionForm): ConstructionForm {
  if (!stored || typeof stored !== "object") return initial;
  const out = { ...initial };
  for (const key of ["length", "width", "floors", "mumty", "parapet", "foundation"] as const) {
    const value = (stored as Record<string, unknown>)[key];
    if (typeof value === "string") out[key] = value;
  }
  const id = (stored as Record<string, unknown>).packageId;
  if (constructionPackages.some((p) => p.id === id)) out.packageId = id as PackageId;
  return out;
}
export function calculateConstruction(form: ConstructionForm) {
  const selected = constructionPackages.find((p) => p.id === form.packageId) ?? constructionPackages[0];
  const index = constructionPackages.indexOf(selected);
  const length = parseNumber(form.length), width = parseNumber(form.width), floors = parseNumber(form.floors);
  const errors: string[] = [];
  if (!Number.isFinite(length) || length <= 0) errors.push("Enter a length greater than zero.");
  if (!Number.isFinite(width) || width <= 0) errors.push("Enter a width greater than zero.");
  if (!Number.isSafeInteger(floors) || floors < 1) errors.push("Enter a whole number of floors, including the ground floor (minimum 1).");
  const area = length * width, totalArea = area * floors;
  const items: { label: string; area: number; rate: number; amount: number }[] = [{ label: `${selected.name} construction`, area: totalArea, rate: selected.rate, amount: totalArea * selected.rate }];
  for (const [key, label, rate] of [
    ["mumty", "Mumty", 1200], ["parapet", "Brick Parapet Wall (4 inch)", 240], ["foundation", "Basement / Raft Foundation", [400, 500, 640][index]],
  ] as const) {
    const quantity = parseNumber(form[key]);
    if (!Number.isFinite(quantity) || quantity < 0) errors.push(`Enter a valid ${label.toLowerCase()} area (zero if not required).`);
    else if (quantity > 0) items.push({ label, area: quantity, rate, amount: quantity * rate });
  }
  const total = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  if (errors.length === 0 && (!Number.isFinite(total) || total > Number.MAX_SAFE_INTEGER / 100)) errors.push("The calculated amount is too large. Check the dimensions and floor count.");
  return { valid: errors.length === 0, errors, selected, index, length, width, floors, area, totalArea, items, total };
}
export type ConstructionResult = ReturnType<typeof calculateConstruction>;
export const constructionNotes = [
  "Total built-up area = length x width x total floors. Every floor is assumed to have the same area; ground floor counts as one floor.",
  "Mumty, parapet and basement / raft foundation are charged separately only for the additional areas entered; enter zero when not required. Do not include the same area twice.",
  "Kitchen and bathroom fittings can be customised at extra cost. Marble and granite laying charges may vary.",
  "Structural design and ceiling height are to be confirmed before work starts.",
  "Platinum septic tank capacity is listed as 12,000 litres as supplied; confirm this specification before acceptance.",
  "Taxes, site-specific work, payment milestones and final scope must be agreed before acceptance. No separate tax amount has been added to this estimate.",
];
export interface ConstructionQuotation { client: ClientDetails; result: ConstructionResult }
export function constructionPriceExplanation(r: ConstructionResult) {
  const base = r.items[0].amount;
  const extras = Math.round(r.items.slice(1).reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
  return {
    base,
    extras,
    steps: [
      { title: "Area of one floor", formula: `${formatNumber(r.length)} ft × ${formatNumber(r.width)} ft`, answer: `${formatNumber(r.area)} sq.ft` },
      { title: "Total construction area", formula: `${formatNumber(r.area)} sq.ft × ${r.floors} floor${r.floors === 1 ? "" : "s"}`, answer: `${formatNumber(r.totalArea)} sq.ft` },
      { title: `${r.selected.name} package cost`, formula: `${formatNumber(r.totalArea)} sq.ft × ${formatINR(r.selected.rate)}/sq.ft`, answer: formatINR(base) },
    ],
  };
}
export function constructionQuotationLines(q: ConstructionQuotation): string[] {
  const { client: c, result: r } = q;
  return [
    "CONSTRUCTION QUOTATION", branding.companyName, branding.priorityLine,
    `Call/WhatsApp: +91-${branding.phone} | Email: ${branding.email}`,
    `Office: ${branding.address}`, `Udyam Registration: ${branding.registrationNumber}`,
    `Quotation: ${c.quotationNumber} | Date: ${formatDateText(c.quotationDate)}`,
    `Valid until: ${formatDateText(addDaysISO(c.quotationDate, 15))}`, "",
    `Client: ${c.name}`, `Phone: ${c.mobile}`, `Project address: ${c.address}`, "",
    `Package: ${r.selected.name} (${formatINR(r.selected.rate)} / sqft)`,
    `Dimensions: ${formatNumber(r.length)} x ${formatNumber(r.width)} ft`,
    `Area per floor: ${formatNumber(r.area)} sqft`,
    `Total floors (including ground): ${r.floors}`,
    `Total built-up area: ${formatNumber(r.totalArea)} sqft`, "", "PRICE BREAKDOWN",
    ...r.items.map((i) => `${i.label}: ${formatNumber(i.area)} sqft x ${formatINR(i.rate)} = ${formatINR(i.amount)}`),
    `TOTAL QUOTATION: ${formatINR(r.total)}`, "", "PACKAGE SPECIFICATIONS",
    ...constructionFeatures.flatMap((section) => [section.title.toUpperCase(), ...(section.note ? [section.note] : []), ...section.rows.map((row) => `${row.label}: ${row.values[r.index]}`), ""]),
    "TERMS & CLARIFICATIONS", ...constructionNotes.map((note) => `- ${note}`), "", "Client acceptance: ____________________", "Authorised signature: ____________________",
  ];
}
