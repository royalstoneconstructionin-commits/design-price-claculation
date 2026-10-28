import { File } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateConstruction, constructionPriceExplanation, constructionQuotationLines, defaultConstructionForm, mergeConstructionForm } from "../construction";
import { createConstructionPdf } from "../construction-pdf";

const form = { ...defaultConstructionForm, length: "40", width: "30", floors: "2" };
const client = { name: "Test Client", mobile: "9876543210", address: "Patna, Bihar", quotationDate: "2026-10-28", quotationNumber: "C/Q-123" };
afterEach(() => vi.unstubAllGlobals());

describe("construction pricing", () => {
  it.each([
    ["silver", 4320000], ["gold", 4800000], ["platinum", 5520000],
  ] as const)("prices %s for all floors including ground", (packageId, total) => {
    const result = calculateConstruction({ ...form, packageId });
    expect(result.valid).toBe(true);
    expect(result.area).toBe(1200);
    expect(result.totalArea).toBe(2400);
    expect(result.total).toBe(total);
    expect(result.items).toHaveLength(1);
  });
  it.each([["silver", 400], ["gold", 500], ["platinum", 640]] as const)("applies optional work rates for %s", (packageId, foundationRate) => {
    const result = calculateConstruction({ ...form, packageId, mumty: "100", parapet: "50", foundation: "1200" });
    expect(result.valid).toBe(true);
    expect(result.total).toBe(2400 * result.selected.rate + 100 * 1200 + 50 * 240 + 1200 * foundationRate);
  });
  it.each([
    { length: "" }, { width: "0" }, { length: "-2" }, { length: "Infinity" },
    { floors: "0" }, { floors: "1.5" }, { floors: "" }, { mumty: "-1" }, { foundation: "invalid" },
    { length: "99999999999999999999999999" },
  ])("rejects invalid dimensions or quantities: %j", (patch) => {
    expect(calculateConstruction({ ...form, ...patch }).valid).toBe(false);
  });
  it("calculates decimal areas without rounding before pricing", () => {
    const result = calculateConstruction({ ...form, length: "30.5", width: "20.25", floors: "1" });
    expect(result.area).toBe(617.625);
    expect(result.total).toBe(1111725);
  });
  it("restores only valid stored fields", () => {
    expect(mergeConstructionForm({ length: 42, width: "25", packageId: "other", floors: null }, defaultConstructionForm)).toEqual({ ...defaultConstructionForm, width: "25" });
  });
  it("explains the area calculation and separates package price from extras", () => {
    const result = calculateConstruction({ ...form, mumty: "100", parapet: "50" });
    const price = constructionPriceExplanation(result);
    expect(price.base).toBe(4320000);
    expect(price.extras).toBe(132000);
    expect(price.steps[0].formula).toBe("40 ft × 30 ft");
    expect(price.steps[1].answer).toBe("2,400 sq.ft");
    expect(price.base + price.extras).toBe(result.total);
  });
});

it("includes client, project, selected specifications and construction terms in the quotation", () => {
  const text = constructionQuotationLines({ client, result: calculateConstruction({ ...form, packageId: "platinum" }) }).join("\n");
  expect(text).toContain("Test Client");
  expect(text).toContain("Patna, Bihar");
  expect(text).toContain("12 Nov 2026");
  expect(text).toContain("TATA Tiscon / Jindal");
  expect(text).toContain("Septic Tank: 12000 Ltrs.");
  expect(text).not.toContain("Kamdhenu");
  expect(text).not.toContain("design services only");
});

it("generates a multi-page construction PDF with client details and package specifications", async () => {
  vi.stubGlobal("File", File);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  const file = await createConstructionPdf({ client, result: calculateConstruction(form) });
  expect(file.name).toBe("Construction-C_Q-123.pdf");
  expect(file.type).toBe("application/pdf");
  const content = await file.text();
  expect(content.startsWith("%PDF-")).toBe(true);
  expect(content).toContain("Test Client");
  expect(content).toContain("Kamdhenu / Sail");
  expect(content).toContain("Page 2 of");
});

it("keeps the pricing steps, all optional charges and the final total on the first PDF page", async () => {
  vi.stubGlobal("File", File);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
  const result = calculateConstruction({ ...form, packageId: "platinum", mumty: "100", parapet: "50", foundation: "1200" });
  const file = await createConstructionPdf({ client, result });
  const content = await file.text();
  const firstPage = content.split("stream\n")[1].split("endstream")[0];
  expect(firstPage).toContain("How your price is calculated");
  expect(firstPage).toContain("40 ft x 30 ft");
  expect(firstPage).toContain("Basement / Raft Foundation");
  expect(firstPage).toContain("TOTAL ESTIMATED CONSTRUCTION COST");
  expect(firstPage).toContain("Rs. 64,20,000");
  expect(content).toContain("material allowances within the package");
});
