import { z } from "zod";
import { branding, quotationTerms } from "./branding";
import { formatINR, formatNumber, formatSqft, parseNumber } from "./format";
import { SERVICE_LABELS } from "./calculator";
import { shortFloorName } from "./floor-design";
import type { CalculationResult, LineService, PaymentFormRow, PricingMode } from "../types/calculator";

export const CLIENT_STORAGE_KEY = "bdc.client.v1";

export interface ClientDetails {
  name: string;
  mobile: string;
  address: string;
  quotationNumber: string;
  quotationDate: string; // YYYY-MM-DD
}

export const defaultClient: ClientDetails = {
  name: "",
  mobile: "",
  address: "",
  quotationNumber: "",
  quotationDate: "",
};

export function mergeClient(stored: unknown, initial: ClientDetails): ClientDetails {
  if (!stored || typeof stored !== "object") return initial;
  return { ...initial, ...(stored as Partial<ClientDetails>) };
}

export function whatsappNumber(mobile: string): string | null {
  const compact = mobile.trim().replace(/[\s-]/g, "");
  if (!/^(\+?91)?[6-9]\d{9}$/.test(compact)) return null;
  const digits = compact.replace(/^\+/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}

export const clientSchema = z.object({
  name: z.string().trim().min(1, "Enter the client name."),
  mobile: z
    .string()
    .trim()
    .refine((v) => v === "" || whatsappNumber(v) !== null, {
      message: "Enter a valid 10-digit Indian mobile number.",
    }),
  address: z.string().trim(),
  quotationNumber: z.string().trim().min(1, "Quotation number is required."),
  quotationDate: z.string().min(1, "Choose the quotation date."),
});

export function clientErrors(client: ClientDetails): Partial<Record<keyof ClientDetails, string>> {
  const parsed = clientSchema.safeParse(client);
  if (parsed.success) return {};
  const out: Partial<Record<keyof ClientDetails, string>> = {};
  for (const issue of parsed.error.issues) {
    const key = issue.path[0] as keyof ClientDetails;
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function todayISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function generateQuotationNumber(now = new Date(), random = Math.random()): string {
  const compact = todayISO(now).replace(/-/g, "");
  const suffix = String(Math.floor(random * 900) + 100);
  return `Q-${compact}-${suffix}`;
}

export function formatDateText(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(y, m - 1, d),
  );
}

export function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return todayISO(new Date(y, m - 1, d + days));
}

/* ---------- Payment schedule ---------- */

export interface PaymentScheduleResult {
  valid: boolean;
  error?: string;
  totalPercent: number;
  rows: { label: string; percent: number; amount: number }[];
}

export function computePaymentSchedule(rows: PaymentFormRow[], finalAmount: number): PaymentScheduleResult {
  const parsed = rows.map((r) => ({ label: r.label.trim() || "Payment", percent: parseNumber(r.percent) }));
  const bad = parsed.find((r) => !Number.isFinite(r.percent) || r.percent <= 0 || r.percent > 100);
  const totalPercent = Number(parsed.reduce((a, r) => a + (Number.isFinite(r.percent) ? r.percent : 0), 0).toPrecision(12));
  const rowsOut = parsed.map((r) => ({
    ...r,
    amount: Number.isFinite(r.percent) ? Number(((finalAmount * r.percent) / 100).toPrecision(12)) : 0,
  }));
  if (bad) {
    return { valid: false, error: "Each payment percentage must be a number above 0 and up to 100.", totalPercent, rows: rowsOut };
  }
  if (Math.abs(totalPercent - 100) > 1e-9) {
    return { valid: false, error: `Payment percentages add up to ${formatNumber(totalPercent)}%; they must total 100%.`, totalPercent, rows: rowsOut };
  }
  return { valid: true, totalPercent, rows: rowsOut };
}

/* ---------- Quotation data ---------- */

export interface QuotationData {
  client: ClientDetails;
  dateText: string;
  validUntilText: string;
  plot: { length: number; width: number };
  mode: PricingMode;
  result: CalculationResult;
  payments: PaymentScheduleResult;
  branding: typeof branding;
  terms: typeof quotationTerms;
}

export const modeLabel = (mode: PricingMode) =>
  mode === "original" ? "Original quotation pricing" : "Unique design pricing";

export function buildQuotationData(args: {
  client: ClientDetails;
  length: number;
  width: number;
  result: CalculationResult;
  payments: PaymentScheduleResult;
}): QuotationData {
  return {
    client: args.client,
    dateText: formatDateText(args.client.quotationDate),
    validUntilText: formatDateText(addDaysISO(args.client.quotationDate, quotationTerms.validityDays)),
    plot: { length: args.length, width: args.width },
    mode: args.result.mode,
    result: args.result,
    payments: args.payments,
    branding,
    terms: quotationTerms,
  };
}

export function floorDesignLines(result: CalculationResult): string[] {
  return result.floors.map((f) => {
    const design = f.isUnique
      ? f.modified
        ? `Modified copy of ${shortFloorName(f.refersTo ?? 0)} Floor (revised plan)`
        : "New design"
      : `Same as ${f.rootLabel}`;
    return `${f.label}: ${design} (${formatSqft(f.areaSqft)})`;
  });
}

export function buildSummaryText(q: QuotationData): string {
  const r = q.result;
  const lines: string[] = [];
  lines.push(`*BUILDING DESIGN QUOTATION*`);
  lines.push(q.branding.companyName);
  lines.push(`Call/WhatsApp: +91-${q.branding.phone}`);
  lines.push(`Email: ${q.branding.email}`);
  lines.push(q.branding.address);
  lines.push(`Udyam Registration: ${q.branding.registrationNumber}`);
  lines.push(`No: ${q.client.quotationNumber} | Date: ${q.dateText}`);
  lines.push("");
  lines.push(`Client: ${q.client.name}${q.client.mobile ? ` (${q.client.mobile})` : ""}`);
  if (q.client.address) lines.push(`Project: ${q.client.address}`);
  lines.push(`Plot: ${formatNumber(q.plot.length)} × ${formatNumber(q.plot.width)} ft (${formatSqft(r.groundFloorArea)})`);
  lines.push(`Building: ${r.buildingLabel} – ${r.levels} floor(s), ${formatSqft(r.totalConstructedArea)}`);
  lines.push(`Unique plans: ${r.uniqueDesigns} | Repeated plans: ${r.repeatedDesigns}`);
  lines.push(`Method: ${modeLabel(q.mode)}`);
  lines.push("");
  lines.push("*Services*");
  (Object.keys(r.serviceTotals) as LineService[]).forEach((k) => {
    if (r.items.some((it) => it.service === k)) lines.push(`• ${SERVICE_LABELS[k]}: ${formatINR(r.serviceTotals[k])}`);
  });
  lines.push("");
  lines.push(`Subtotal: ${formatINR(r.subtotal)}`);
  if (r.discountAmount > 0) lines.push(`Discount: -${formatINR(r.discountAmount)}`);
  lines.push(`*Final amount: ${formatINR(r.finalAmount)}*`);
  if (q.payments.valid) {
    lines.push("");
    lines.push("*Payment schedule*");
    q.payments.rows.forEach((p) => lines.push(`• ${p.label} (${formatNumber(p.percent)}%): ${formatINR(p.amount)}`));
  }
  lines.push("");
  lines.push(`Valid until: ${q.validUntilText}`);
  if (q.branding.phone) lines.push(`Contact: ${q.branding.phone}`);
  return lines.join("\n");
}

export function whatsappUrl(text: string, mobile: string): string {
  const digits = whatsappNumber(mobile);
  if (!digits) throw new Error("Enter the client's valid WhatsApp number.");
  return `https://wa.me/${digits}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
