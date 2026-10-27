"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Copy, Download, MessageCircle, Printer } from "lucide-react";
import { calculate } from "@/lib/calculator";
import { defaultForm, FORM_STORAGE_KEY, mergeForm, toCalculatorInput } from "@/lib/form-state";
import { createQuotationPdfFile, downloadQuotationPdf } from "@/lib/pdf";
import { canSharePdf, downloadPdfFile, sharePdf } from "@/lib/share-pdf";
import { usePersistedState } from "@/lib/use-persisted-state";
import {
  buildQuotationData,
  buildSummaryText,
  CLIENT_STORAGE_KEY,
  clientErrors,
  computePaymentSchedule,
  defaultClient,
  generateQuotationNumber,
  mergeClient,
  todayISO,
  whatsappNumber,
  whatsappUrl,
  type QuotationData,
} from "@/lib/quotation";
import type { FormState } from "@/types/calculator";
import ClientDetailsForm from "@/components/quotation/ClientDetailsForm";
import QuotationPreview from "@/components/quotation/QuotationPreview";
import PaymentSchedule from "@/components/calculator/PaymentSchedule";

export default function QuotationPage() {
  const [form, setForm, formReady] = usePersistedState<FormState>(FORM_STORAGE_KEY, defaultForm, mergeForm);
  const [client, setClient, clientReady] = usePersistedState(CLIENT_STORAGE_KEY, defaultClient, mergeClient);
  const [attempted, setAttempted] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [requireMobile, setRequireMobile] = useState(false);
  const [preparedPdf, setPreparedPdf] = useState<{ quotation: QuotationData; file: File | null } | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);
  const recipient = whatsappNumber(client.mobile);

  // Fill in today's date and a quotation number the first time.
  useEffect(() => {
    if (!clientReady) return;
    if (!client.quotationDate || !client.quotationNumber) {
      setClient((c) => ({
        ...c,
        quotationDate: c.quotationDate || todayISO(),
        quotationNumber: c.quotationNumber || generateQuotationNumber(),
      }));
    }
  }, [clientReady, client.quotationDate, client.quotationNumber, setClient]);

  const input = useMemo(() => toCalculatorInput(form), [form]);
  const result = useMemo(() => calculate(input), [input]);
  const payments = useMemo(
    () => computePaymentSchedule(form.payments, result.finalAmount),
    [form.payments, result.finalAmount],
  );

  const quotation = useMemo(
    () =>
      result.valid && client.quotationDate
        ? buildQuotationData({ client, length: input.length, width: input.width, result, payments })
        : null,
    [result, client, input.length, input.width, payments],
  );

  // Prepare before the click so the native share call retains user activation.
  // Associate the attachment with its data to avoid sharing a previous client's PDF.
  useEffect(() => {
    if (!quotation) return;
    let cancelled = false;
    setShareError(null);
    const timer = window.setTimeout(() => {
      createQuotationPdfFile(quotation).then(
        (file) => { if (!cancelled) setPreparedPdf({ quotation, file }); },
        () => { if (!cancelled) setPreparedPdf({ quotation, file: null }); },
      );
    }, 400);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [quotation]);

  const pdfPreparing = !!quotation && preparedPdf?.quotation !== quotation;

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 3000);
  };

  /** Checks the client form and the payment schedule before sharing or downloading. */
  const ready = (): boolean => {
    setAttempted(true);
    if (Object.keys(clientErrors(client)).length > 0) {
      flash("Please fix the highlighted client details.");
      return false;
    }
    if (!payments.valid) {
      flash(payments.error ?? "Payment schedule is not valid.");
      return false;
    }
    return true;
  };

  const onPdf = async () => {
    if (!quotation || !ready()) return;
    setBusy(true);
    try {
      await downloadQuotationPdf(quotation);
    } catch {
      flash("Could not create the PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const onCopy = async () => {
    if (!quotation || !ready()) return;
    const text = buildSummaryText(quotation);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    flash("Quotation summary copied.");
  };

  const onWhatsApp = async () => {
    setRequireMobile(true);
    if (!recipient) {
      flash("Enter the client's valid WhatsApp number to send the quotation.");
      document.getElementById("client-mobile")?.focus();
      return;
    }
    if (!quotation || !ready()) return;
    setShareError(null);
    const file = preparedPdf?.quotation === quotation ? preparedPdf.file : null;
    if (!file) {
      setBusy(true);
      try {
        const retry = await createQuotationPdfFile(quotation);
        setPreparedPdf({ quotation, file: retry });
        flash("PDF ready. Click WhatsApp PDF again to share it.");
      } catch {
        setShareError("Could not prepare the PDF. Click WhatsApp PDF to retry.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setBusy(true);
    try {
      if (canSharePdf(file)) {
        await sharePdf(file);
      } else {
        downloadPdfFile(file);
        window.open(whatsappUrl("", client.mobile), "_blank", "noopener,noreferrer");
        setShareError("PDF downloaded. In the client's WhatsApp chat, attach the downloaded PDF as a document, then press Send.");
      }
    } catch {
      setShareError("Could not open PDF sharing. Try again, or download the PDF and attach it in the client's chat below.");
    } finally {
      setBusy(false);
    }
  };

  const onPrint = () => {
    if (!quotation || !ready()) return;
    window.print();
  };

  const actionClass =
    "flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-3 text-sm font-semibold text-stone-800 active:scale-[0.99] disabled:opacity-50";

  return (
    <main className="mx-auto max-w-5xl px-4 pb-10 pt-4">
      <div className="mb-4 flex items-center justify-between print:hidden">
        <Link href="/" className="flex h-10 items-center gap-2 text-sm font-medium text-emerald-800">
          <ArrowLeft className="h-4 w-4" /> Back to calculator
        </Link>
        <h1 className="text-lg font-semibold text-stone-900">Quotation</h1>
      </div>

      {!formReady || !clientReady ? (
        <p className="text-sm text-stone-500">Loading…</p>
      ) : !result.valid ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <p className="font-semibold">The calculator inputs need fixing first:</p>
          <ul className="mt-1 list-disc pl-5">
            {result.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
          <Link href="/" className="mt-3 inline-block font-semibold underline">
            Go back and correct them
          </Link>
        </div>
      ) : (
        <div className="lg:grid lg:grid-cols-[340px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className="space-y-4 print:hidden">
            <ClientDetailsForm
              client={client}
              showAllErrors={attempted}
              requireMobile={requireMobile}
              onChange={(patch) => setClient((c) => ({ ...c, ...patch }))}
            />
            <PaymentSchedule
              rows={form.payments}
              finalAmount={result.finalAmount}
              onChange={(rows) => setForm((f) => ({ ...f, payments: rows }))}
            />
            <div className="grid grid-cols-2 gap-2">
              <button type="button" className={`${actionClass} bg-emerald-700 text-white border-emerald-700`} onClick={onPdf} disabled={busy}>
                <Download className="h-4 w-4" /> {busy ? "Creating…" : "Download PDF"}
              </button>
              <button type="button" className={actionClass} onClick={onPrint}>
                <Printer className="h-4 w-4" /> Print
              </button>
              <button type="button" className={actionClass} onClick={onCopy}>
                <Copy className="h-4 w-4" /> Copy summary
              </button>
              <button type="button" className={actionClass} onClick={onWhatsApp} disabled={busy || pdfPreparing}>
                <MessageCircle className="h-4 w-4" /> {pdfPreparing ? "Preparing PDF..." : "WhatsApp PDF"}
              </button>
            </div>
            <p className="text-xs leading-relaxed text-stone-600">
              {recipient ? `WhatsApp recipient: ${client.name.trim() || "Client"} (+${recipient}). ` : "Enter the client's WhatsApp number above. "}
              Click WhatsApp PDF, choose WhatsApp in the share menu, select this client and press Send.
              {" "}If file sharing is unavailable, the PDF downloads and the client's chat opens so you can attach it.
            </p>
            {shareError && (
              <div role="status" className="space-y-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <p>{shareError}</p>
                {recipient && <a className="inline-block font-semibold underline" href={whatsappUrl("", client.mobile)} target="_blank" rel="noopener noreferrer">Open client's WhatsApp chat</a>}
              </div>
            )}
            {message && (
              <p role="status" className="rounded-xl bg-stone-900 px-3 py-2 text-sm text-white">
                {message}
              </p>
            )}
          </div>

          <div className="mt-4 lg:mt-0">{quotation ? <QuotationPreview q={quotation} /> : null}</div>
        </div>
      )}
    </main>
  );
}
