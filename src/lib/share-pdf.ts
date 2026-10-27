export function canSharePdf(file: File): boolean {
  return typeof navigator.share === "function" &&
    typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
}

export async function sharePdf(file: File): Promise<"shared" | "cancelled"> {
  try {
    // Share only the attachment; WhatsApp should not receive a text summary.
    await navigator.share({ files: [file] });
    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
    throw error;
  }
}

export function downloadPdfFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
