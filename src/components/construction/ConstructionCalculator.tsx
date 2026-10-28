"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, MessageCircle, Printer, Share2 } from "lucide-react";
import { Card, Field, Row, inputClass } from "@/components/ui";
import ConstructionQuotationPreview from "./ConstructionQuotationPreview";
import ClientDetailsForm from "@/components/quotation/ClientDetailsForm";
import { branding } from "@/lib/branding";
import { calculateConstruction, constructionFeatures, constructionNotes, constructionPackages, defaultConstructionForm, mergeConstructionForm, type ConstructionForm, type ConstructionQuotation } from "@/lib/construction";
import { createConstructionPdf } from "@/lib/construction-pdf";
import { formatINR, formatNumber } from "@/lib/format";
import { addDaysISO, clientErrors, defaultClient, formatDateText, generateQuotationNumber, mergeClient, todayISO, whatsappNumber, whatsappUrl } from "@/lib/quotation";
import { canSharePdf, downloadPdfFile, sharePdf } from "@/lib/share-pdf";
import { usePersistedState } from "@/lib/use-persisted-state";

export default function ConstructionCalculator() {
  const [form, setForm, formReady] = usePersistedState("bdc.construction.v1", defaultConstructionForm, mergeConstructionForm);
  const [client, setClient, clientReady] = usePersistedState("bdc.construction.client.v1", defaultClient, mergeClient);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState<{ quotation: ConstructionQuotation; file: File } | null>(null);
  const [pdfError, setPdfError] = useState("");
  const result = useMemo(() => calculateConstruction(form), [form]);
  const quotation = useMemo(() => ({ client, result }), [client, result]);
  const recipient = whatsappNumber(client.mobile);
  const detailsValid = Object.keys(clientErrors(client)).length === 0 && !!recipient && !!client.address.trim();
  const pdf = prepared?.quotation === quotation ? prepared.file : null;
  const update = (patch: Partial<ConstructionForm>) => setForm((previous) => ({ ...previous, ...patch }));

  useEffect(() => {
    if (!clientReady) return;
    if (!client.quotationDate || !client.quotationNumber) setClient((previous) => ({
      ...previous,
      quotationDate: previous.quotationDate || todayISO(),
      quotationNumber: previous.quotationNumber || `C-${generateQuotationNumber()}`,
    }));
  }, [clientReady, client.quotationDate, client.quotationNumber, setClient]);

  useEffect(() => {
    if (!formReady || !clientReady || !result.valid || !detailsValid) return;
    let cancelled = false;
    setPdfError("");
    const timer = window.setTimeout(() => {
      createConstructionPdf(quotation).then(
        (file) => { if (!cancelled) setPrepared({ quotation, file }); },
        () => { if (!cancelled) setPdfError("Could not prepare the PDF. Use Download PDF to retry."); },
      );
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [quotation, formReady, clientReady, result.valid, detailsValid]);

  const ready = () => {
    setAttempted(true);
    if (!result.valid || !detailsValid) {
      setMessage("Check the project dimensions and complete the client name, valid phone number, project address, quotation number and date.");
      return false;
    }
    setMessage("");
    return true;
  };
  const download = async () => {
    if (!ready()) return;
    setBusy(true);
    try {
      const file = pdf ?? await createConstructionPdf(quotation);
      setPrepared({ quotation, file });
      setPdfError("");
      downloadPdfFile(file);
    } catch { setMessage("Could not create the PDF. Please try again."); }
    finally { setBusy(false); }
  };
  const onWhatsApp = () => {
    if (!ready()) return;
    const text = [
      `*CONSTRUCTION QUOTATION - ${branding.companyName}*`,
      `No: ${client.quotationNumber} | Date: ${formatDateText(client.quotationDate)}`,
      `Client: ${client.name}`, `Phone: ${client.mobile}`, `Project address: ${client.address}`,
      `Package: ${result.selected.name} at ${formatINR(result.selected.rate)}/sqft`,
      `Dimensions: ${formatNumber(result.length)} x ${formatNumber(result.width)} ft`,
      `Area per floor: ${formatNumber(result.area)} sqft`, `Floors including ground: ${result.floors}`,
      `Total built-up area: ${formatNumber(result.totalArea)} sqft`,
      ...result.items.map((item) => `${item.label}: ${formatNumber(item.area)} sqft x ${formatINR(item.rate)} = ${formatINR(item.amount)}`),
      `*Total: ${formatINR(result.total)}*`,
      `Valid until: ${formatDateText(addDaysISO(client.quotationDate, 15))}`,
      ...constructionNotes.map((note) => `- ${note}`),
      "Full package specifications are in the quotation PDF.", `Contact: +91-${branding.phone}`,
    ].join("\n");
    window.open(whatsappUrl(text, client.mobile), "_blank", "noopener,noreferrer");
  };
  const onSharePdf = async () => {
    if (!ready() || !pdf) return;
    setBusy(true);
    try {
      if (canSharePdf(pdf)) {
        await sharePdf(pdf);
      } else {
        downloadPdfFile(pdf);
        window.open(whatsappUrl("", client.mobile), "_blank", "noopener,noreferrer");
        setMessage("PDF downloaded. Attach it as a document in the client's WhatsApp chat, then press Send.");
      }
    } catch { setMessage("Could not share the PDF. Download it and attach it in WhatsApp."); }
    finally { setBusy(false); }
  };

  if (!formReady || !clientReady) return <p className="mt-6 text-sm text-stone-500">Loading construction calculator…</p>;

  return (
    <div className="mt-5 space-y-5">
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_380px] print:hidden">
        <div className="space-y-5">
          <Card title="Choose your construction package" subtitle="Select a package to calculate the cost and include its specifications in your quotation.">
            <fieldset className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <legend className="sr-only">Construction package</legend>
              {constructionPackages.map((pack) => (
                <label key={pack.id} className={`relative cursor-pointer rounded-xl border-2 p-4 transition-colors ${form.packageId === pack.id ? "border-red-600 bg-red-50" : "border-stone-200 hover:border-red-300"}`}>
                  <input type="radio" name="construction-package" value={pack.id} checked={form.packageId === pack.id} onChange={() => update({ packageId: pack.id })} className="absolute right-3 top-4 accent-red-600" />
                  <span className="block pr-5 text-lg font-semibold">{pack.name}</span>
                  <span className="mt-2 block text-xl font-bold text-red-700">{formatINR(pack.rate)}</span>
                  <span className="text-xs text-stone-500">per sq.ft</span>
                </label>
              ))}
            </fieldset>
          </Card>
          <Card title="Project dimensions" subtitle="Enter dimensions in feet. All floors use the same area.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Length (ft)"><input type="number" min="0.01" step="any" inputMode="decimal" className={inputClass} value={form.length} placeholder="e.g. 40" onChange={(e) => update({ length: e.target.value })} /></Field>
              <Field label="Width (ft)"><input type="number" min="0.01" step="any" inputMode="decimal" className={inputClass} value={form.width} placeholder="e.g. 30" onChange={(e) => update({ width: e.target.value })} /></Field>
              <div className="col-span-2"><Field label="Total number of floors" hint="Include the ground floor: 1 = Ground, 2 = G+1, 3 = G+2."><input type="number" min="1" step="1" inputMode="numeric" className={inputClass} value={form.floors} onChange={(e) => update({ floors: e.target.value })} /></Field></div>
            </div>
          </Card>
          <Card title="Optional additional work" subtitle="Enter additional area in sq.ft, or leave at 0. These charges are added to the package cost.">
            <div className="space-y-3">
              {([
                ["mumty", "Mumty area", 1200],
                ["parapet", "4-inch brick parapet wall area", 240],
                ["foundation", "Basement / raft foundation area", [400, 500, 640][result.index]],
              ] as const).map(([key, label, rate]) => (
                <Field key={key} label={`${label} (sq.ft)`} hint={`${formatINR(rate)}/sq.ft${key === "foundation" ? ` · RCC ${[6, 8, 10][result.index]} inch` : ""}`}>
                  <input type="number" min="0" step="any" inputMode="decimal" className={inputClass} value={form[key]} onChange={(e) => update({ [key]: e.target.value })} />
                </Field>
              ))}
            </div>
          </Card>
          <ClientDetailsForm client={client} showAllErrors={attempted} requireMobile onChange={(patch) => setClient((previous) => ({ ...previous, ...patch }))} />
          {attempted && !client.address.trim() && <p role="alert" className="text-sm text-red-700">Enter the project address.</p>}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-4">
          <Card title="Construction price summary">
            <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{result.selected.name} · {formatINR(result.selected.rate)}/sq.ft</p>
            {result.valid ? <>
              <dl>
                <Row label="Area per floor" value={`${formatNumber(result.area)} sq.ft`} />
                <Row label="Total floors (including ground)" value={result.floors} />
                <Row label="Total built-up area" value={`${formatNumber(result.totalArea)} sq.ft`} strong />
                {result.items.map((item) => <Row key={item.label} label={item.label} value={formatINR(item.amount)} />)}
              </dl>
              <div className="mt-4 rounded-xl bg-stone-900 p-4 text-white"><p className="text-sm text-stone-300">Total quotation amount</p><p className="mt-1 text-3xl font-bold">{formatINR(result.total)}</p></div>
              <p className="mt-2 text-xs text-stone-500">{formatNumber(result.length)} × {formatNumber(result.width)} × {result.floors} floors × {formatINR(result.selected.rate)} + selected extras. No separate tax amount added.</p>
            </> : <ul className="list-disc space-y-1 pl-5 text-sm text-stone-600">{result.errors.map((error) => <li key={error}>{error}</li>)}</ul>}
          </Card>
          <Card title="Create & send quotation">
            <div className="space-y-2">
              <button type="button" onClick={() => { if (ready()) document.getElementById("construction-quotation")?.scrollIntoView({ behavior: "smooth" }); }} className="flex min-h-12 w-full items-center justify-center rounded-xl bg-stone-900 px-3 font-semibold text-white">View full quotation</button>
              <button type="button" onClick={download} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-3 font-semibold text-white disabled:opacity-50"><Download className="h-5 w-5" />{busy ? "Please wait…" : "Download PDF"}</button>
              <button type="button" onClick={onWhatsApp} disabled={busy} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 font-semibold text-white disabled:opacity-50"><MessageCircle className="h-5 w-5" />WhatsApp quotation</button>
              <button type="button" onClick={onSharePdf} disabled={busy || !pdf} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-emerald-700 px-3 font-semibold text-emerald-800 disabled:opacity-50"><Share2 className="h-5 w-5" />{!pdf && detailsValid && result.valid && !pdfError ? "Preparing PDF…" : "Share PDF on WhatsApp"}</button>
              <button type="button" onClick={() => { if (ready()) window.print(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-stone-300 px-3 font-semibold"><Printer className="h-5 w-5" />Print quotation</button>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-stone-500">WhatsApp quotation opens the client’s chat with the price summary; press Send in WhatsApp. To send the full PDF, use Share PDF and select WhatsApp and the client. If file sharing is unavailable, attach the downloaded PDF in the client’s chat.</p>
            {(message || pdfError) && <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{message || pdfError}</p>}
          </Card>
        </aside>
      </div>

      <details className="rounded-2xl border border-stone-200 bg-white p-4 print:hidden">
        <summary className="cursor-pointer py-2 font-semibold text-stone-900">Compare all package specifications <span className="ml-2 text-sm font-normal text-stone-500">View details ↓</span></summary>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[780px] border-collapse text-left text-sm">
            <caption className="sr-only">Silver, Gold and Platinum construction package comparison</caption>
            <thead><tr><th scope="col" className="border-b p-3">Features</th>{constructionPackages.map((p) => <th key={p.id} scope="col" className={`border-b p-3 ${p.id === form.packageId ? "bg-red-50 text-red-800" : ""}`}>{p.name}<span className="mt-1 block">{formatINR(p.rate)}/sq.ft</span></th>)}</tr></thead>
            {constructionFeatures.map((section) => <tbody key={section.title}>
              <tr><th colSpan={4} className="bg-stone-100 p-3">{section.title}{section.note && <span className="ml-2 font-normal text-stone-500">{section.note}</span>}</th></tr>
              {section.rows.map((row) => <tr key={row.label}><th scope="row" className="border-b border-stone-100 p-3 font-medium">{row.label}</th>{row.values.map((value, i) => <td key={i} className={`border-b border-stone-100 p-3 ${i === result.index ? "bg-red-50/50" : ""}`}>{value}</td>)}</tr>)}
            </tbody>)}
          </table>
        </div>
      </details>

      {result.valid && <ConstructionQuotationPreview quotation={quotation} draft={!detailsValid} />}
    </div>
  );
}
