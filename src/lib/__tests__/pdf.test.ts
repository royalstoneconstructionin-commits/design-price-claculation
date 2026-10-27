import { File } from "node:buffer";
import { readFileSync } from "node:fs";
import { afterEach, expect, it, vi } from "vitest";
import { calculate } from "../calculator";
import { defaultForm, toCalculatorInput } from "../form-state";
import { buildQuotationData, computePaymentSchedule, defaultClient } from "../quotation";
import { createQuotationPdfFile } from "../pdf";

afterEach(() => vi.unstubAllGlobals());

it("creates a shareable PDF with the quotation and existing company logo", async () => {
  vi.stubGlobal("File", File);
  const bytes = readFileSync("public/logo.png");
  const fetchLogo = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  });
  vi.stubGlobal("fetch", fetchLogo);
  const input = toCalculatorInput(defaultForm);
  const result = calculate(input);
  const quotation = buildQuotationData({
    client: { ...defaultClient, name: "Test Client", mobile: "9876543210", quotationNumber: "Q/123", quotationDate: "2026-10-27" },
    length: input.length,
    width: input.width,
    result,
    payments: computePaymentSchedule(defaultForm.payments, result.finalAmount),
  });
  const file = await createQuotationPdfFile(quotation);
  expect(file.name).toBe("Q_123.pdf");
  expect(file.type).toBe("application/pdf");
  expect(file.size).toBeGreaterThan(1000);
  expect((await file.text()).startsWith("%PDF-")).toBe(true);
  expect(fetchLogo).toHaveBeenCalledWith("/logo.png");
});
