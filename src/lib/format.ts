const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const plain = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 6,
});

const moneyPlain = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** ₹31,000 / ₹2.5 / ₹1,23,456.75 */
export function formatINR(value: number): string {
  return inr.format(value);
}

/** "Rs. 31,000" – used in the PDF, whose built-in font has no ₹ glyph. */
export function formatRs(value: number): string {
  return `Rs. ${moneyPlain.format(value)}`;
}

/** 1,200 (never rounds away real digits) */
export function formatNumber(value: number): string {
  return plain.format(value);
}

export function formatSqft(value: number): string {
  return `${formatNumber(value)} sqft`;
}

/** Strict numeric parser: "" and "12abc" give NaN. */
export function parseNumber(text: string): number {
  const t = text.trim();
  if (!/^(\d+\.?\d*|\.\d+)$/.test(t)) return NaN;
  return Number(t);
}
