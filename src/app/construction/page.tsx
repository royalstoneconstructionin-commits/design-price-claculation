import type { Metadata } from "next";
import ConstructionCalculator from "@/components/construction/ConstructionCalculator";
import CalculatorNavigation from "@/components/CalculatorNavigation";
import CompanyLogo from "@/components/CompanyLogo";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Construction Calculators – ${branding.companyName}`,
  description: "Compare construction packages, calculate building costs and download or share a client quotation.",
};

export default function ConstructionPage() {
  return (
    <>
      <header className="border-b border-stone-200 bg-white print:hidden">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <CompanyLogo branding={branding} />
          <div>
            <h1 className="text-base font-semibold leading-tight text-stone-900 sm:text-lg">
              Construction Calculators
            </h1>
            <p className="text-xs text-stone-500">{branding.companyName}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-10 pt-6">
        <CalculatorNavigation active="construction" />
        <ConstructionCalculator />
      </main>
    </>
  );
}
