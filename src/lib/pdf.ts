import { SERVICE_LABELS } from "./calculator";
import { formatNumber, formatRs, formatSqft } from "./format";
import { floorDesignLines, modeLabel, type QuotationData } from "./quotation";
import type { LineService } from "../types/calculator";

/**
 * Builds the quotation PDF in the browser for download or sharing.
 * jsPDF's built-in font has no ₹ glyph, so the PDF uses "Rs.".
 */
async function buildQuotationPdf(q: QuotationData) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  const M = 15;
  const R = W - M;
  const bottom = 282;
  let y = M;

  const ink: [number, number, number] = [31, 41, 51];
  const grey: [number, number, number] = [100, 110, 120];
  const green: [number, number, number] = [4, 120, 87];

  const ensure = (h: number) => {
    if (y + h > bottom) {
      doc.addPage();
      y = M;
    }
  };
  const text = (s: string, x: number, size = 10, bold = false, color = ink, align: "left" | "right" | "center" = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(s, x, y, { align });
  };
  const line = (x1 = M, x2 = R, shade = 220) => {
    doc.setDrawColor(shade, shade, shade);
    doc.setLineWidth(0.2);
    doc.line(x1, y, x2, y);
  };
  const heading = (s: string) => {
    ensure(12);
    y += 4;
    text(s.toUpperCase(), M, 9, true, green);
    y += 2;
    line(M, R, 190);
    y += 5;
  };
  const wrapped = (s: string, x: number, width: number, size = 9, color = ink, lead = 4.2) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(s, width) as string[];
    for (const l of lines) {
      ensure(lead);
      text(l, x, size, false, color);
      y += lead;
    }
  };

  const b = q.branding;
  const r = q.result;

  // ---- Header ----
  const headerTop = y;
  const logoSize = 28;
  const logoResponse = b.logoSrc ? await fetch(b.logoSrc) : null;
  if (logoResponse?.ok) {
    const logoBytes = new Uint8Array(await logoResponse.arrayBuffer());
    const image = doc.getImageProperties(logoBytes);
    const scale = Math.min(logoSize / image.width, logoSize / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    doc.addImage(logoBytes, image.fileType, M + (logoSize - width) / 2, headerTop + (logoSize - height) / 2, width, height);
  } else {
    doc.setFillColor(28, 25, 23);
    doc.roundedRect(M, y, logoSize, logoSize, 2, 2, "F");
    y += 16;
    text(b.logoText, M + logoSize / 2, 11, true, [251, 191, 36], "center");
  }
  const headerX = M + logoSize + 6;
  const headerWidth = R - headerX;
  const centeredHeader = (value: string, width = R - M, center = W / 2, size = 10, bold = false) => {
    doc.setFont("times", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(value, width) as string[];
    for (const valueLine of lines) {
      doc.text(valueLine, center, y, { align: "center" });
      y += 4.5;
    }
  };
  y = headerTop + 5;
  text(b.companyName.toUpperCase(), headerX + headerWidth / 2, 14, true, [53, 95, 150], "center");
  y += 10;
  centeredHeader(b.priorityLine, headerWidth, headerX + headerWidth / 2, 10.5, true);
  centeredHeader(b.registrationStatement, headerWidth, headerX + headerWidth / 2);
  y = Math.max(y, headerTop + logoSize) + 4;
  centeredHeader(`Reg. No. ${b.registrationNumber}`);
  centeredHeader(`Copyright © ${q.client.quotationDate.slice(0, 4)} ${b.companyName.toUpperCase()} - All Rights Reserved.`);
  y += 3;
  centeredHeader(`Call/WhatsApp: +91-${b.phone}   Email: ${b.email}`);
  if (b.website) centeredHeader(`Website: ${b.website}`);
  centeredHeader(`Office Address: ${b.address}`);
  y += 2;
  line(M, R, 120);
  y += 8;

  text("QUOTATION", M, 16, true, green);
  const mY = y;
  text(`No: ${q.client.quotationNumber}`, R, 9.5, true, ink, "right");
  y += 5;
  text(`Date: ${q.dateText}`, R, 9.5, false, ink, "right");
  y += 5;
  text(`Valid until: ${q.validUntilText}`, R, 9.5, false, ink, "right");
  y = Math.max(y, mY) + 4;

  // ---- Client & project ----
  heading("Client");
  text(q.client.name, M, 11, true);
  y += 5;
  if (q.client.mobile) {
    text(`Mobile: ${q.client.mobile}`, M, 9.5);
    y += 4.5;
  }
  if (q.client.address) wrapped(`Project address: ${q.client.address}`, M, R - M, 9.5);

  heading("Project");
  const facts: [string, string][] = [
    ["Plot size", `${formatNumber(q.plot.length)} x ${formatNumber(q.plot.width)} ft`],
    ["Ground floor area", formatSqft(r.groundFloorArea)],
    ["Building", `${r.buildingLabel} (${r.levels} floor${r.levels > 1 ? "s" : ""})`],
    ["Total construction area", formatSqft(r.totalConstructedArea)],
    ["Unique floor designs", String(r.uniqueDesigns)],
    ["Repeated floor designs", String(r.repeatedDesigns)],
    ["Pricing method", modeLabel(q.mode)],
  ];
  for (const [k, v] of facts) {
    ensure(5);
    text(k, M, 9.5, false, grey);
    text(v, M + 55, 9.5, true);
    y += 5;
  }

  heading("Floor designs");
  floorDesignLines(r).forEach((l) => wrapped(l, M, R - M, 9.2));

  // ---- Charges table ----
  heading("Service breakdown");
  const cArea = 128;
  const cRate = 160;
  ensure(8);
  text("Description", M, 8.5, true, grey);
  text("Area / Qty", cArea, 8.5, true, grey, "right");
  text("Rate", cRate, 8.5, true, grey, "right");
  text("Amount", R, 8.5, true, grey, "right");
  y += 2;
  line();
  y += 4.5;

  for (const it of r.items) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const labelLines = doc.splitTextToSize(it.label, 88) as string[];
    const noteLines = it.note ? (doc.splitTextToSize(it.note, 88) as string[]) : [];
    ensure(labelLines.length * 4.2 + noteLines.length * 3.6 + 3);
    const top = y;
    labelLines.forEach((l, i) => {
      text(l, M, 9, false, ink);
      if (i < labelLines.length - 1) y += 4.2;
    });
    const rowTextY = y;
    y = top;
    text(it.areaSqft !== null ? `${formatNumber(it.areaSqft)} sqft` : `${formatNumber(it.quantity ?? 0)}`, cArea, 9, false, ink, "right");
    text(it.areaSqft !== null ? `${formatRs(it.rate)}/sqft` : formatRs(it.rate), cRate, 9, false, ink, "right");
    text(formatRs(it.amount), R, 9, true, ink, "right");
    y = rowTextY + 4;
    noteLines.forEach((l) => {
      text(l, M, 7.5, false, grey);
      y += 3.6;
    });
    y += 0.5;
    line(M, R, 235);
    y += 4;
  }

  // ---- Totals ----
  ensure(40);
  const totals: [string, string, boolean][] = [];
  (Object.keys(r.serviceTotals) as LineService[]).forEach((k) => {
    if (r.items.some((it) => it.service === k)) totals.push([SERVICE_LABELS[k], formatRs(r.serviceTotals[k]), false]);
  });
  totals.push(["Subtotal", formatRs(r.subtotal), true]);
  if (r.discountAmount > 0) totals.push(["Discount", `- ${formatRs(r.discountAmount)}`, false]);
  for (const [k, v, bold] of totals) {
    ensure(6);
    text(k, 120, 9.5, bold, bold ? ink : grey);
    text(v, R, 9.5, bold, ink, "right");
    y += 5.5;
  }
  ensure(14);
  doc.setFillColor(green[0], green[1], green[2]);
  doc.roundedRect(105, y - 4, R - 105, 11, 2, 2, "F");
  y += 3;
  text("FINAL AMOUNT", 109, 10, true, [255, 255, 255]);
  text(formatRs(r.finalAmount), R - 4, 12, true, [255, 255, 255], "right");
  y += 12;

  // ---- Payment schedule ----
  if (q.payments.valid) {
    heading("Payment schedule");
    for (const p of q.payments.rows) {
      ensure(6);
      text(`${p.label} (${formatNumber(p.percent)}%)`, M, 9.5);
      text(formatRs(p.amount), R, 9.5, true, ink, "right");
      y += 5.5;
    }
  }

  // ---- Terms & notes ----
  heading("Payment terms");
  q.terms.paymentTerms.forEach((t) => wrapped(`- ${t}`, M, R - M, 9));
  heading("Validity & notes");
  wrapped(`- This quotation is valid until ${q.validUntilText}.`, M, R - M, 9);
  q.terms.notes.forEach((t) => wrapped(`- ${t}`, M, R - M, 9));
  if (r.warnings.length) {
    heading("Billing remarks");
    r.warnings.forEach((t) => wrapped(`- ${t}`, M, R - M, 8.5, grey));
  }

  // ---- Footer page numbers ----
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(grey[0], grey[1], grey[2]);
    doc.text(`${b.companyName} | ${q.client.quotationNumber} | Page ${p} of ${pages}`, W / 2, 291, { align: "center" });
  }

  return doc;
}

function quotationFilename(q: QuotationData): string {
  const safe = q.client.quotationNumber.replace(/[^A-Za-z0-9_-]/g, "_") || "quotation";
  return `${safe}.pdf`;
}

export async function createQuotationPdfFile(q: QuotationData): Promise<File> {
  const doc = await buildQuotationPdf(q);
  return new File([doc.output("blob")], quotationFilename(q), { type: "application/pdf" });
}

export async function downloadQuotationPdf(q: QuotationData): Promise<void> {
  const doc = await buildQuotationPdf(q);
  doc.save(quotationFilename(q));
}
