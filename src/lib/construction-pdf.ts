import { constructionFeatures, constructionNotes, constructionPriceExplanation, type ConstructionQuotation } from "./construction";
import { branding } from "./branding";
import { formatNumber, formatRs } from "./format";
import { addDaysISO, formatDateText } from "./quotation";

export async function createConstructionPdf(q: ConstructionQuotation): Promise<File> {
  if (!q.result.valid) throw new Error("Correct the construction inputs first.");
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const { client, result: r } = q;
  const price = constructionPriceExplanation(r);
  const ink = [28, 31, 38] as const;
  const muted = [100, 108, 120] as const;
  const red = [185, 28, 28] as const;
  type Color = readonly [number, number, number];
  let y = 15;
  const plain = (value: string) => value.replace(/₹/g, "Rs. ").replace(/[–—]/g, "-").replace(/×/g, "x").replace(/·/g, "|").replace(/[“”]/g, '"').replace(/’/g, "'");
  const text = (value: string, x: number, top: number, size = 9, bold = false, color: Color = ink, align: "left" | "right" = "left") => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    doc.text(plain(value), x, top, { align });
  };
  const wrap = (value: string, width: number, size = 9, bold = false): string[] => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(plain(value), width) as string[];
  };
  const box = (x: number, top: number, width: number, height: number, color: Color) => {
    doc.setFillColor(...color);
    doc.roundedRect(x, top, width, height, 2, 2, "F");
  };
  const rule = (top: number) => { doc.setDrawColor(225, 228, 232); doc.line(15, top, 195, top); };
  const pageAccent = () => { doc.setFillColor(...red); doc.rect(0, 0, 210, 3, "F"); };
  const newPage = (label: string) => {
    doc.addPage();
    pageAccent();
    text(branding.companyName, 15, 14, 10, true);
    text("CONSTRUCTION QUOTATION", 195, 14, 8, true, red, "right");
    y = 20;
    for (const line of wrap(`${client.quotationNumber} | ${r.selected.name} package`, 180, 8)) {
      text(line, 15, y, 8, false, muted); y += 4;
    }
    rule(y); y += 9;
    text(label, 15, y, 15, true); y += 9;
  };
  const ensure = (height: number, label = "Quotation continued") => {
    if (y + height > 277) newPage(label);
  };
  const paragraph = (value: string, size = 8.5, color: Color = muted) => {
    for (const line of wrap(value, 180, size)) {
      ensure(4.4); text(line, 15, y, size, false, color); y += 4.4;
    }
  };
  const fitText = (value: string, x: number, top: number, width: number, initialSize: number, bold = true, color: Color = ink) => {
    let size = initialSize;
    doc.setFont("helvetica", bold ? "bold" : "normal"); doc.setFontSize(size);
    while (doc.getTextWidth(plain(value)) > width && size > 7) { size -= 0.5; doc.setFontSize(size); }
    text(value, x, top, size, bold, color);
  };

  pageAccent();
  let logoLoaded = false;
  if (branding.logoSrc) {
    try {
      const response = await fetch(branding.logoSrc);
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        const image = doc.getImageProperties(bytes);
        const scale = Math.min(24 / image.width, 24 / image.height);
        doc.addImage(bytes, image.fileType, 15, 12, image.width * scale, image.height * scale);
        logoLoaded = true;
      }
    } catch { /* Use the company initials if the logo is unavailable. */ }
  }
  if (!logoLoaded) {
    box(15, 12, 24, 24, ink);
    fitText(branding.logoText, 19, 26, 16, 13, true, [255, 255, 255]);
  }
  fitText(branding.companyName, 44, 17, 151, 17);
  text(branding.priorityLine, 44, 23, 8, false, muted);
  text(`+91-${branding.phone} | ${branding.email}`, 44, 28, 8);
  let officeY = 32.5;
  for (const line of wrap(branding.address.replace(/\n/g, ", "), 151, 7.5)) { text(line, 44, officeY, 7.5, false, muted); officeY += 3.5; }
  text(`Reg. No. ${branding.registrationNumber}`, 44, officeY, 7.5, false, muted);
  y = Math.max(42, officeY + 5); rule(y); y += 10;
  text("CONSTRUCTION", 15, y, 18, true);
  text("QUOTATION", 15, y + 7, 18, true, red);
  let metaY = y - 2;
  for (const value of [client.quotationNumber, `Issued: ${formatDateText(client.quotationDate)}`, `Valid until: ${formatDateText(addDaysISO(client.quotationDate, 15))}`]) {
    for (const line of wrap(value, 83, 8.5)) { text(line, 195, metaY, 8.5, false, muted, "right"); metaY += 4; }
  }
  y = Math.max(y + 14, metaY + 3);

  const nameLines = wrap(client.name, 76, 11, true);
  const addressLines = wrap(client.address, 90, 9);
  const clientHeight = Math.max(23, 17 + nameLines.length * 5, 12 + addressLines.length * 4.5);
  if (clientHeight > 100) {
    text("PREPARED FOR", 15, y, 8, true, red); y += 6;
    paragraph(`${client.name} | ${client.mobile}`, 10, ink);
    paragraph(`Project address: ${client.address}`, 9, ink); y += 4;
  } else {
    ensure(clientHeight);
    box(15, y, 180, clientHeight, [246, 247, 249]);
    text("PREPARED FOR", 19, y + 6, 7.5, true, muted);
    nameLines.forEach((line, i) => text(line, 19, y + 12 + i * 5, 11, true));
    text(`Phone: ${client.mobile}`, 19, y + 17 + (nameLines.length - 1) * 5, 9);
    text("PROJECT ADDRESS", 101, y + 6, 7.5, true, muted);
    addressLines.forEach((line, i) => text(line, 101, y + 12 + i * 4.5, 9));
    y += clientHeight + 5;
  }
  ensure(17); box(15, y, 180, 13, [254, 242, 242]);
  text(`${r.selected.name.toUpperCase()} PACKAGE`, 19, y + 8, 10, true, red);
  text(`${formatRs(r.selected.rate)} / sq.ft`, 191, y + 8, 12, true, red, "right"); y += 18;

  ensure(50); text("How your price is calculated", 15, y, 12, true); y += 5;
  price.steps.forEach((step, i) => {
    const x = 15 + i * 61;
    box(x, y, 58, 24, [246, 247, 249]);
    text(`0${i + 1}  ${step.title}`, x + 3, y + 6, 8, true);
    fitText(step.formula, x + 3, y + 12, 52, 8, false, muted);
    fitText(`= ${step.answer}`, x + 3, y + 20, 52, 13);
  });
  y += 28;
  text(`Ground floor included | ${r.floors} total floor(s) | Same area on each floor`, 15, y, 7.5, false, muted); y += 7;

  const tableHeader = () => {
    box(15, y, 180, 9, ink);
    text("WORK DESCRIPTION", 18, y + 6, 7.5, true, [255, 255, 255]);
    text("AREA (SQ.FT)", 121, y + 6, 7.5, true, [255, 255, 255], "right");
    text("RATE / SQ.FT", 156, y + 6, 7.5, true, [255, 255, 255], "right");
    text("AMOUNT", 192, y + 6, 7.5, true, [255, 255, 255], "right"); y += 9;
  };
  ensure(30); text("Itemised price breakdown", 15, y, 12, true); y += 5; tableHeader();
  r.items.forEach((item, i) => {
    const lines = wrap(item.label, 72, 9, true);
    const height = Math.max(11, lines.length * 4 + 7);
    if (y + height > 277) { newPage("Itemised price breakdown continued"); tableHeader(); }
    lines.forEach((line, j) => text(line, 18, y + 5 + j * 4, 9, true));
    text(i === 0 ? "All floors combined" : "Additional work", 18, y + height - 2.5, 7, false, muted);
    text(formatNumber(item.area), 121, y + 6, 8.5, false, ink, "right");
    text(formatRs(item.rate), 156, y + 6, 8.5, false, ink, "right");
    text(formatRs(item.amount), 192, y + 6, 9, true, ink, "right");
    y += height; rule(y);
  });
  y += 5;
  paragraph(`Each line amount = area x rate. ${r.items.length === 1 ? "No optional additional work selected." : "Only the additional work listed above is charged."}`, 7.5); y += 2;
  ensure(51, "Your quotation total"); box(15, y, 180, 35, [246, 247, 249]);
  text("Construction package cost", 19, y + 7, 8.5);
  text(formatRs(price.base), 191, y + 7, 9, true, ink, "right");
  text("Additional work", 19, y + 13, 8.5);
  text(`+ ${formatRs(price.extras)}`, 191, y + 13, 9, true, ink, "right");
  doc.setDrawColor(218, 220, 225); doc.line(19, y + 17, 191, y + 17);
  text("TOTAL ESTIMATED CONSTRUCTION COST", 19, y + 25, 9, true, red);
  text(formatRs(r.total), 191, y + 28, 20, true, red, "right"); y += 41;
  paragraph("Package cost + additional work. This is the total project estimate, not an advance payment. No separate tax amount has been added; taxes and payment milestones are to be agreed.", 7.5);

  newPage(`Your ${r.selected.name} package specifications`);
  paragraph('Brand options and price limits describe your selected package. "Up to" amounts are material allowances within the package, not extra charges added to your quotation total. Upgrades may cost extra.'); y += 4;
  for (const section of constructionFeatures) {
    const sectionHeader = (continued = false) => {
      box(15, y, 180, 9, [237, 239, 242]);
      text(`${section.title}${continued ? " (continued)" : ""}`, 19, y + 6, 10, true); y += 12;
    };
    const noteLines = section.note ? wrap(section.note, 180, 8) : [];
    const firstRow = section.rows[0];
    const firstHeight = Math.max(wrap(firstRow.label, 65, 8.5).length, wrap(firstRow.values[r.index], 104, 8.5).length) * 4.2 + 5;
    ensure(15 + noteLines.length * 4.4 + firstHeight, "Package specifications continued");
    sectionHeader();
    if (section.note) paragraph(section.note, 8);
    for (const row of section.rows) {
      const labels = wrap(row.label, 65, 8.5);
      const values = wrap(row.values[r.index], 104, 8.5);
      const height = Math.max(labels.length, values.length) * 4.2 + 5;
      if (y + height > 277) { newPage("Package specifications continued"); sectionHeader(true); }
      labels.forEach((line, i) => text(line, 19, y + 3 + i * 4.2, 8.5, false, muted));
      values.forEach((line, i) => text(line, 88, y + 3 + i * 4.2, 8.5));
      y += height; rule(y - 1);
    }
    y += 5;
  }
  ensure(25, "Before you approve"); text("Before you approve", 15, y, 12, true); y += 7;
  for (const note of constructionNotes) { paragraph(`- ${note}`, 8); y += 2; }
  ensure(31, "Acceptance"); y += 20;
  doc.setDrawColor(180); doc.line(15, y, 90, y); doc.line(120, y, 195, y);
  text("Client acceptance", 15, y + 5, 9, true);
  text("Authorised signature", 120, y + 5, 9, true);
  text("Signature & date", 15, y + 10, 8, false, muted);
  text(branding.companyName, 120, y + 10, 8, false, muted);
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    rule(284);
    text(`Construction quotation | ${branding.companyName}`, 15, 290, 7, false, muted);
    text(`Page ${page} of ${pages}`, 195, 290, 8, false, muted, "right");
  }
  const safeName = q.client.quotationNumber.replace(/[^A-Za-z0-9_-]/g, "_") || "quotation";
  return new File([doc.output("blob")], `Construction-${safeName}.pdf`, { type: "application/pdf" });
}
