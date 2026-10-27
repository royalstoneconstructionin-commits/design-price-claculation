import type { ReactNode } from "react";

export const inputClass =
  "h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base text-stone-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20";

export function Card({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 ${className}`}>
      {title && (
        <header className="mb-3">
          <h2 className="text-base font-semibold text-stone-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  );
}

export function Row({ label, value, strong }: { label: string; value: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
      <dt className="text-stone-600">{label}</dt>
      <dd className={`text-right ${strong ? "font-semibold text-stone-900" : "text-stone-800"}`}>{value}</dd>
    </div>
  );
}
