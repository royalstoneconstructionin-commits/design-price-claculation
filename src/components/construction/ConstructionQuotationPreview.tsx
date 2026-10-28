import CompanyLogo from "@/components/CompanyLogo";
import { branding } from "@/lib/branding";
import { constructionFeatures, constructionNotes, constructionPriceExplanation, type ConstructionQuotation } from "@/lib/construction";
import { formatINR, formatNumber } from "@/lib/format";
import { addDaysISO, formatDateText } from "@/lib/quotation";

export default function ConstructionQuotationPreview({ quotation: { client, result: r }, draft }: { quotation: ConstructionQuotation; draft: boolean }) {
  const price = constructionPriceExplanation(r);
  return (
    <article id="construction-quotation" className="scroll-mt-4 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      <div className="h-2 bg-red-600 print:bg-red-600" />
      <div className="p-5 sm:p-9 print:p-0 print:pt-5">
        <header className="flex flex-col items-start gap-5 border-b border-stone-200 pb-6 sm:flex-row sm:justify-between">
          <div className="flex w-full min-w-0 flex-1 items-center gap-4 sm:w-auto">
            <CompanyLogo branding={branding} className="h-16 w-16 shrink-0 sm:h-20 sm:w-20" />
            <div><p className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">{branding.companyName}</p><p className="mt-1 text-xs text-stone-500">{branding.priorityLine}</p><p className="mt-2 text-xs">+91-{branding.phone} · {branding.email}</p><p className="mt-1 whitespace-pre-line text-xs text-stone-500">{branding.address}</p><p className="mt-1 text-xs text-stone-500">Reg. No. {branding.registrationNumber}</p></div>
          </div>
          <div className="text-sm sm:text-right"><p className="text-xs font-bold uppercase tracking-[0.18em] text-red-700">Construction quotation</p><p className="mt-2 break-all font-semibold">{client.quotationNumber || "Draft"}</p><p className="mt-1 text-stone-500">Issued: {client.quotationDate ? formatDateText(client.quotationDate) : "—"}</p><p className="text-stone-500">Valid until: {client.quotationDate ? formatDateText(addDaysISO(client.quotationDate, 15)) : "—"}</p></div>
        </header>

        {draft && <p className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900 print:hidden">Draft preview — complete the client details before downloading or sending.</p>}

        <div className="my-6 grid gap-4 sm:grid-cols-2 print:grid-cols-2">
          <section className="rounded-xl border border-stone-200 p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-stone-500">Prepared for</h2><p className="mt-2 text-lg font-semibold">{client.name || "Client name"}</p><p className="mt-1 text-sm">{client.mobile || "Client phone"}</p><p className="mt-3 text-xs font-semibold uppercase text-stone-500">Project address</p><p className="mt-1 whitespace-pre-wrap break-words text-sm">{client.address || "Project address"}</p></section>
          <section className="rounded-xl border border-red-100 bg-red-50 p-4"><h2 className="text-xs font-bold uppercase tracking-wider text-red-700">Selected construction package</h2><div className="mt-2 flex flex-wrap items-baseline justify-between gap-2"><p className="text-2xl font-bold text-stone-900">{r.selected.name}</p><p className="text-xl font-bold text-red-700">{formatINR(r.selected.rate)}<span className="text-sm font-normal"> / sq.ft</span></p></div><p className="mt-3 text-sm text-stone-600">{r.floors === 1 ? "Ground floor only" : `Ground + ${r.floors - 1} upper floor${r.floors > 2 ? "s" : ""}`} · {r.floors} total floor{r.floors > 1 ? "s" : ""}</p><p className="mt-1 text-xs text-stone-500">Materials and finishes are detailed in the package specifications below.</p></section>
        </div>

        <section className="mb-6 print:break-inside-avoid">
          <h2 className="text-lg font-bold text-stone-900">How your construction price is calculated</h2>
          <p className="mt-1 text-sm text-stone-500">Three steps from your building dimensions to the package cost.</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3 print:grid-cols-3">
            {price.steps.map((step, i) => <div key={step.title} className="rounded-xl border border-stone-200 p-4"><div className="flex items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-bold text-white">{i + 1}</span><h3 className="text-sm font-semibold">{step.title}</h3></div><p className="mt-3 text-sm text-stone-500">{step.formula}</p><p className="mt-1 text-xl font-bold text-stone-900">= {step.answer}</p></div>)}
          </div>
          <p className="mt-2 text-xs text-stone-500">Each floor has the same area. The ground floor is included in the floor count.</p>
        </section>

        <section className="print:break-inside-avoid">
          <h2 className="mb-3 text-lg font-bold text-stone-900">Itemised price breakdown</h2>
          <div className="overflow-x-auto rounded-xl border border-stone-200"><table className="w-full text-left text-xs sm:text-sm"><caption className="sr-only">Area multiplied by rate for each construction charge</caption><thead className="bg-stone-900 text-white"><tr><th scope="col" className="p-3 font-medium">Work description</th><th scope="col" className="p-3 text-right font-medium">Area<br />(sq.ft)</th><th scope="col" className="p-3 text-right font-medium">Rate<br />(per sq.ft)</th><th scope="col" className="p-3 text-right font-medium">Amount</th></tr></thead><tbody>{r.items.map((item, i) => <tr key={item.label} className="border-b border-stone-100 last:border-0"><td className="p-3"><span className="font-semibold">{i === 0 ? `${r.selected.name} construction package` : item.label}</span><span className="mt-1 block text-xs text-stone-500">{i === 0 ? "All floors combined · specifications below" : "Additional work · charged separately"}</span></td><td className="p-3 text-right tabular-nums">{formatNumber(item.area)}</td><td className="p-3 text-right tabular-nums">{formatINR(item.rate)}</td><td className="p-3 text-right font-semibold tabular-nums">{formatINR(item.amount)}</td></tr>)}</tbody></table></div>
          <p className="mt-2 text-xs text-stone-500">Each line amount = area × rate. {r.items.length === 1 ? "No optional additional work has been selected." : "Only the additional work listed above is charged."}</p>
          <div className="mt-4 rounded-xl bg-stone-50 p-4 sm:ml-auto sm:max-w-md">
            <dl className="space-y-2 text-sm"><div className="flex justify-between gap-4"><dt>Construction package cost</dt><dd className="font-semibold">{formatINR(price.base)}</dd></div><div className="flex justify-between gap-4"><dt>Additional work</dt><dd className="font-semibold">+ {formatINR(price.extras)}</dd></div></dl>
            <div className="mt-4 border-t border-stone-200 pt-4"><p className="text-xs font-bold uppercase tracking-wider text-red-700">Total estimated construction cost</p><p className="mt-1 text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">{formatINR(r.total)}</p><p className="mt-2 text-xs text-stone-500">Package cost + additional work. This is the total project estimate, not an advance payment.</p></div>
            <p className="mt-3 border-t border-stone-200 pt-3 text-xs text-stone-500">No separate tax amount has been added. Taxes and payment milestones are to be agreed before acceptance.</p>
          </div>
        </section>

        <section className="mt-9 border-t border-stone-200 pt-6">
          <h2 className="text-xl font-bold">Your {r.selected.name} package specifications</h2>
          <p className="mb-5 mt-1 text-sm text-stone-500">Brand options and price limits describe the selected package. “Up to” amounts are material allowances within the package, not extra charges added to the total above. Upgrades may cost extra.</p>
          {constructionFeatures.map((section) => <section key={section.title} className="mb-5 overflow-hidden rounded-xl border border-stone-200"><h3 className="bg-stone-100 px-4 py-3 text-sm font-bold">{section.title}</h3>{section.note && <p className="px-4 pt-3 text-xs text-stone-500">{section.note}</p>}<dl>{section.rows.map((row) => <div key={row.label} className="grid gap-1 border-t border-stone-100 px-4 py-3 text-sm sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] print:grid-cols-2 print:break-inside-avoid"><dt className="text-stone-600">{row.label}</dt><dd className="font-medium">{row.values[r.index]}</dd></div>)}</dl></section>)}
        </section>
        <section className="mt-6 rounded-xl border border-stone-200 bg-stone-50 p-5"><h2 className="mb-3 font-bold">Before you approve</h2><ul className="list-disc space-y-2 pl-4 text-xs leading-relaxed text-stone-600">{constructionNotes.map((note) => <li key={note}>{note}</li>)}</ul></section>
        <div className="mt-12 grid grid-cols-2 gap-8 text-sm print:break-inside-avoid"><div className="border-t border-stone-300 pt-3"><p className="font-semibold">Client acceptance</p><p className="mt-1 text-xs text-stone-500">Signature & date</p></div><div className="border-t border-stone-300 pt-3"><p className="font-semibold">For {branding.companyName}</p><p className="mt-1 text-xs text-stone-500">Authorised signature & date</p></div></div>
        <p className="mt-8 text-center text-xs text-stone-400">Thank you for considering {branding.companyName} for your project.</p>
      </div>
    </article>
  );
}
