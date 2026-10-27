import { describe, expect, it } from "vitest";
import { clientErrors, defaultClient, whatsappNumber, whatsappUrl } from "../quotation";

describe("WhatsApp quotation recipient", () => {
  it("opens the client's chat without a text summary for PDF attachment", () => {
    expect(whatsappUrl("", "9876543210")).toBe("https://wa.me/919876543210");
  });

  it.each(["9876543210", "919876543210", "+91 98765-43210"])(
    "opens the client's chat for %s and preserves the quotation text",
    (mobile) => {
      const text = "Quotation Q-123\nClient: A & B\nFinal amount: ₹12,000";
      const url = new URL(whatsappUrl(text, mobile));
      expect(url.origin).toBe("https://wa.me");
      expect(url.pathname).toBe("/919876543210");
      expect(url.searchParams.get("text")).toBe(text);
      expect(clientErrors({ ...defaultClient, mobile }).mobile).toBeUndefined();
    },
  );

  it.each(["", "   ", "12345", "1234567890", "9876543210abc", "+91987654321099"])(
    "prevents sharing without a valid recipient: %s",
    (mobile) => {
      expect(whatsappNumber(mobile)).toBeNull();
      expect(() => whatsappUrl("Quotation", mobile)).toThrow();
    },
  );

  it("keeps the phone optional for downloading a quotation", () => {
    expect(clientErrors({ ...defaultClient, mobile: "" }).mobile).toBeUndefined();
  });
});
