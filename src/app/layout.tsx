import type { Metadata, Viewport } from "next";
import "./globals.css";
import { branding } from "@/lib/branding";

export const metadata: Metadata = {
  title: `Building Design Cost Calculator – ${branding.companyName}`,
  description: "Calculate building design charges floor by floor and create a quotation.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#047857",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
