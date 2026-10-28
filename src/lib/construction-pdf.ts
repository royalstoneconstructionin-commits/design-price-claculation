import { constructionQuotationLines, type ConstructionQuotation } from "./construction";
import { branding } from "./branding";

export async function createConstructionPdf(q: ConstructionQuotation): Promise<File> {
  if (!q.result.valid) throw new Error("Correct the construction inputs first.");
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  let y = 18;
  if (branding.logoSrc) {
    try {
      const response = await fetch(branding.logoSrc);
      if (response.ok) {
        const bytes = new Uint8Array(await response.arrayBuffer());
        const image = doc.getImageProperties(bytes);
        const scale = Math.min(25 / image.width, 25 / image.height);
        doc.addImage(bytes, image.fileType, 15, y, image.width * scale, image.height * scale);
        y += 30;
      }
    } catch { /* Company details remain visible if the logo cannot be loaded. */ }
  }
  for (const value of constructionQuotationLines(q)) {
    const plain = value.replace(/₹/g, "Rs. ").replace(/[–—]/g, "-");
    const heading = plain !== "" && plain === plain.toUpperCase() && /[A-Z]/.test(plain);
    doc.setFont("helvetica", heading ? "bold" : "normal");
    doc.setFontSize(heading ? 11 : 9.5);
    doc.setTextColor(heading ? 185 : 40, heading ? 28 : 40, heading ? 28 : 40);
    const lines = doc.splitTextToSize(plain || " ", 180) as string[];
    for (const line of lines) {
      if (y > 278) { doc.addPage(); y = 18; }
      doc.text(line, 15, y);
      y += 5;
    }
    if (heading) y += 2;
  }
  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(`Construction quotation | Page ${page} of ${pages}`, 105, 290, { align: "center" });
  }
  const safeName = q.client.quotationNumber.replace(/[^A-Za-z0-9_-]/g, "_") || "quotation";
  return new File([doc.output("blob")], `Construction-${safeName}.pdf`, { type: "application/pdf" });
}
