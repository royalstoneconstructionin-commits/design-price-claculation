import { File } from "node:buffer";
import { afterEach, describe, expect, it, vi } from "vitest";
import { canSharePdf, sharePdf } from "../share-pdf";

afterEach(() => vi.unstubAllGlobals());

describe("PDF file sharing", () => {
  const file = new File(["%PDF-1.3"], "Q-123.pdf", { type: "application/pdf" }) as unknown as globalThis.File;

  it("shares the PDF attachment without a text message", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    const canShare = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { share, canShare });
    expect(canSharePdf(file)).toBe(true);
    expect(canShare).toHaveBeenCalledWith({ files: [file] });
    expect(await sharePdf(file)).toBe("shared");
    expect(share).toHaveBeenCalledExactlyOnceWith({ files: [file] });
  });

  it.each([{}, { share: vi.fn() }, { share: vi.fn(), canShare: () => false }])(
    "requires both native sharing and support for the PDF file",
    (navigator) => {
      vi.stubGlobal("navigator", navigator);
      expect(canSharePdf(file)).toBe(false);
    },
  );

  it("treats cancelling the share menu as cancellation", async () => {
    const error = new Error("Cancelled");
    error.name = "AbortError";
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(error) });
    expect(await sharePdf(file)).toBe("cancelled");
  });

  it("reports sharing failures so the page can offer the download fallback", async () => {
    vi.stubGlobal("navigator", { share: vi.fn().mockRejectedValue(new Error("Unavailable")) });
    await expect(sharePdf(file)).rejects.toThrow("Unavailable");
  });
});
