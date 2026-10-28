import Link from "next/link";

export default function CalculatorNavigation({ active }: { active: "design" | "construction" }) {
  return (
    <nav aria-label="Calculator category" className="flex gap-4 print:hidden">
      {[
        { key: "design", label: "Design", href: "/" },
        { key: "construction", label: "Construction", href: "/construction" },
      ].map(({ key, label, href }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={`flex min-h-[74px] min-w-0 flex-1 items-center justify-center rounded-xl border px-4 text-lg font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-red-600 sm:flex-none sm:px-9 sm:text-2xl ${
            active === key
              ? "border-red-600 bg-red-600 text-white hover:bg-red-700"
              : "border-slate-200 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
