import { SERVICE_LABELS } from "@/lib/calculator";
import { formatINR, formatNumber, formatSqft } from "@/lib/format";
import { floorDesignLines, modeLabel, type QuotationData } from "@/lib/quotation";
import type { LineService } from "@/types/calculator";
import CompanyLogo from "@/components/CompanyLogo";

export default function QuotationPreview({ q }: { q: QuotationData }) {
  const r = q.result;
  const b = q.branding;
  const serviceKeys = (Object.keys(r.serviceTotals) as LineService[]).filter((k) =>
    r.items.some((it) => it.service === k),
  );

  return (
    <article className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-800 shadow-sm sm:p-6 print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-stone-300 pb-5 text-center font-serif text-black">
        <div className="grid grid-cols-[72px_minmax(0,1fr)] items-start gap-x-3 gap-y-4 sm:grid-cols-[96px_minmax(0,1fr)]">
          <CompanyLogo branding={b} className="row-span-2 h-[72px] w-[72px] sm:h-24 sm:w-24" />
          <p className="pt-1 font-sans text-lg font-bold uppercase text-[#355f96] sm:text-xl">{b.companyName}</p>
          <div className="space-y-1 text-sm leading-snug">
            <p className="font-bold">{b.priorityLine}</p>
            <p>{b.registrationStatement}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm leading-snug">
          <p>Reg. No. {b.registrationNumber}</p>
          <p>Copyright © {q.client.quotationDate.slice(0, 4)} {b.companyName.toUpperCase()} – All Rights Reserved.</p>
        </div>
        <div className="mt-4 space-y-1 text-sm leading-snug">
          <p className="flex flex-wrap justify-center gap-x-3 gap-y-1">
            <a href={`tel:+91${b.phone}`}>Call/WhatsApp: +91-{b.phone}</a>
            <a href={`mailto:${b.email}`} className="break-all">Email: {b.email}</a>
          </p>
          {b.website && <p>Website: {b.website}</p>}
          <p className="whitespace-pre-line">Office Address: {b.address}</p>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-xl font-bold tracking-wide text-emerald-800">QUOTATION</h2>
        <div className="text-xs text-stone-600 sm:text-right">
          <p>
            No: <strong>{q.client.quotationNumber}</strong>
          </p>
          <p>Date: {q.dateText}</p>
          <p>Valid until: {q.validUntilText}</p>
        </div>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase text-stone-500">Client</p>
          <p className="font-semibold">{q.client.name || "—"}</p>
          {q.client.mobile && <p>{q.client.mobile}</p>}
          {q.client.address && <p className="text-stone-600">{q.client.address}</p>}
        </div>
        <div className="rounded-xl bg-stone-50 p-3">
          <p className="text-xs font-semibold uppercase text-stone-500">Project</p>
          <p>
            Plot: {formatNumber(q.plot.length)} × {formatNumber(q.plot.width)} ft ({formatSqft(r.groundFloorArea)})
          </p>
          <p>
            Building: {r.buildingLabel} – {r.levels} floor{r.levels > 1 ? "s" : ""}
          </p>
          <p>Total area: {formatSqft(r.totalConstructedArea)}</p>
          <p>
            Unique designs: {r.uniqueDesigns} · Repeated: {r.repeatedDesigns}
          </p>
          <p className="text-xs text-stone-500">{modeLabel(q.mode)}</p>
        </div>
      </section>

      <section className="mt-4">
        <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Floor designs</h3>
        <ul className="space-y-0.5 text-stone-700">
          {floorDesignLines(r).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>

      <section className="mt-4">
        <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Service breakdown</h3>
        <ul className="divide-y divide-stone-100">
          {r.items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 py-2">
              <div>
                <p className="font-medium">{it.label}</p>
                <p className="text-xs text-stone-500">{it.formula}</p>
                {it.note && <p className="text-xs text-stone-400">{it.note}</p>}
              </div>
              <p className="shrink-0 font-semibold">{formatINR(it.amount)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-3 space-y-1 border-t border-stone-200 pt-3">
        {serviceKeys.map((k) => (
          <div key={k} className="flex justify-between text-stone-600">
            <span>{SERVICE_LABELS[k]}</span>
            <span>{formatINR(r.serviceTotals[k])}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold">
          <span>Subtotal</span>
          <span>{formatINR(r.subtotal)}</span>
        </div>
        {r.discountAmount > 0 && (
          <div className="flex justify-between text-stone-600">
            <span>Discount</span>
            <span>- {formatINR(r.discountAmount)}</span>
          </div>
        )}
        <div className="mt-2 flex items-center justify-between rounded-xl bg-emerald-800 px-4 py-3 text-white">
          <span className="font-semibold">Final amount</span>
          <span className="text-xl font-bold">{formatINR(r.finalAmount)}</span>
        </div>
      </section>

      {q.payments.valid && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Payment schedule</h3>
          {q.payments.rows.map((p, i) => (
            <div key={i} className="flex justify-between py-0.5">
              <span>
                {p.label} ({formatNumber(p.percent)}%)
              </span>
              <span className="font-semibold">{formatINR(p.amount)}</span>
            </div>
          ))}
        </section>
      )}

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Payment terms</h3>
          <ul className="list-disc space-y-0.5 pl-4 text-stone-600">
            {q.terms.paymentTerms.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Validity & notes</h3>
          <ul className="list-disc space-y-0.5 pl-4 text-stone-600">
            <li>Valid until {q.validUntilText}.</li>
            {q.terms.notes.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      {r.warnings.length > 0 && (
        <section className="mt-4">
          <h3 className="mb-1 text-xs font-semibold uppercase text-emerald-800">Billing remarks</h3>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-stone-500">
            {r.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
