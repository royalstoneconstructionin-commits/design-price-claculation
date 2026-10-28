"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calculator, FileText, RotateCcw } from "lucide-react";
import { branding } from "@/lib/branding";
import { calculate } from "@/lib/calculator";
import { defaultForm, FORM_STORAGE_KEY, mergeForm, toCalculatorInput } from "@/lib/form-state";
import { formatINR } from "@/lib/format";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { FloorFormState, FormState, ServiceKey } from "@/types/calculator";
import PlotDimensions from "@/components/calculator/PlotDimensions";
import BuildingFloorSelector from "@/components/calculator/BuildingFloorSelector";
import FloorDesignConfiguration from "@/components/calculator/FloorDesignConfiguration";
import ServiceSelector from "@/components/calculator/ServiceSelector";
import PricingModeSelector from "@/components/calculator/PricingModeSelector";
import CalculationSummary from "@/components/calculator/CalculationSummary";
import PricingBreakdown from "@/components/calculator/PricingBreakdown";
import PaymentSchedule from "@/components/calculator/PaymentSchedule";
import CompanyLogo from "@/components/CompanyLogo";
import CalculatorNavigation from "@/components/CalculatorNavigation";

export default function CalculatorPage() {
  const [form, setForm] = usePersistedState<FormState>(FORM_STORAGE_KEY, defaultForm, mergeForm);

  const update = (patch: Partial<FormState>) => setForm((p) => ({ ...p, ...patch }));
  const updateFloor = (index: number, patch: Partial<FloorFormState>) =>
    setForm((p) => ({ ...p, floors: p.floors.map((f, i) => (i === index ? { ...f, ...patch } : f)) }));
  const updateService = (key: ServiceKey, on: boolean) =>
    setForm((p) => ({ ...p, services: { ...p.services, [key]: on } }));

  const input = useMemo(() => toCalculatorInput(form), [form]);
  const result = useMemo(() => calculate(input), [input]);
  const original = useMemo(() => calculate({ ...input, mode: "original" }), [input]);
  const unique = useMemo(() => calculate({ ...input, mode: "unique" }), [input]);

  const goToSummary = () =>
    document.getElementById("summary")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <>
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <CompanyLogo branding={branding} />
            <div>
              <h1 className="text-base font-semibold leading-tight text-stone-900 sm:text-lg">
                Building Design Cost Calculator
              </h1>
              <p className="text-xs text-stone-500">{branding.companyName}</p>
            </div>
          </div>
          <Link
            href="/quotation"
            className="hidden h-10 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-sm font-medium text-white sm:flex"
          >
            <FileText className="h-4 w-4" /> Quotation
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-6">
        <CalculatorNavigation active="design" />
      </div>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start lg:gap-6 lg:pb-10">
        <div className="space-y-4">
          <PlotDimensions
            length={form.length}
            width={form.width}
            onChange={(patch) => update(patch)}
          />
          <BuildingFloorSelector levels={form.levels} onChange={(levels) => update({ levels })} />
          <FloorDesignConfiguration
            form={form}
            onFloorChange={updateFloor}
            onAdvancedChange={(advancedAreas) => update({ advancedAreas })}
          />
          <ServiceSelector form={form} onServiceChange={updateService} onChange={update} />
          <PricingModeSelector mode={form.mode} onChange={(mode) => update({ mode })} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={goToSummary}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-700 text-base font-semibold text-white shadow active:scale-[0.99] lg:hidden"
            >
              <Calculator className="h-5 w-5" /> Calculate Price
            </button>
            <button
              type="button"
              onClick={() => setForm(defaultForm)}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-stone-700"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          </div>
        </div>

        <aside
          id="summary"
          className="mt-6 scroll-mt-4 space-y-4 lg:sticky lg:top-4 lg:mt-0 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto lg:pb-2"
        >
          <CalculationSummary
            result={result}
            original={original}
            unique={unique}
            discountType={form.discountType}
            discountValue={form.discountValue}
            onDiscountChange={update}
          />
          <PricingBreakdown result={result} />
          {result.valid && (
            <PaymentSchedule
              rows={form.payments}
              finalAmount={result.finalAmount}
              onChange={(payments) => update({ payments })}
            />
          )}
          {result.valid && (
            <Link
              href="/quotation"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-stone-900 text-base font-semibold text-white"
            >
              <FileText className="h-5 w-5" /> Create Quotation
            </Link>
          )}
        </aside>
      </main>

      {/* Mobile bottom bar */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3">
          <div>
            <p className="text-xs text-stone-500">Final amount</p>
            <p className="text-xl font-bold text-stone-900">{result.valid ? formatINR(result.finalAmount) : "—"}</p>
          </div>
          <button
            type="button"
            onClick={goToSummary}
            className="h-11 rounded-xl border border-emerald-700 px-4 text-sm font-semibold text-emerald-800"
          >
            View details
          </button>
          {result.valid && (
            <Link
              href="/quotation"
              className="flex h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white"
            >
              Quotation
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
