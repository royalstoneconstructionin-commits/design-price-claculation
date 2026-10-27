"use client";

import { useState } from "react";
import type { branding as companyBranding } from "@/lib/branding";

export default function CompanyLogo({
  branding,
  className = "h-12 w-12 shrink-0",
}: {
  branding: typeof companyBranding;
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  return branding.logoSrc && branding.logoSrc !== failedSrc ? (
    // Keep the original logo intact in both the screen and printed quotation.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={branding.logoSrc}
      alt={`${branding.companyName} logo`}
      className={`${className} object-contain`}
      onError={() => setFailedSrc(branding.logoSrc)}
    />
  ) : (
    <span className={`${className} flex items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-amber-400`}>
      {branding.logoText}
    </span>
  );
}
