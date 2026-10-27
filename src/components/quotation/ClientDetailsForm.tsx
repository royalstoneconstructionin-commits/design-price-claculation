import { Card, Field, inputClass } from "@/components/ui";
import { clientErrors, type ClientDetails } from "@/lib/quotation";

interface Props {
  client: ClientDetails;
  showAllErrors: boolean;
  requireMobile?: boolean;
  onChange: (patch: Partial<ClientDetails>) => void;
}

export default function ClientDetailsForm({ client, showAllErrors, requireMobile = false, onChange }: Props) {
  const errors = clientErrors(client);
  if (requireMobile && !client.mobile.trim()) errors.mobile = "Enter the client's WhatsApp number.";
  // Mobile errors show live once typed; the rest only after an attempt to download/share.
  const show = (key: keyof ClientDetails) =>
    showAllErrors || (key === "mobile" && (requireMobile || client.mobile !== "")) ? (errors[key] ?? null) : null;

  return (
    <Card title="Client details">
      <div className="space-y-3">
        <Field label="Client name" error={show("name")}>
          <input className={inputClass} value={client.name} onChange={(e) => onChange({ name: e.target.value })} />
        </Field>
        <Field label="Client mobile / WhatsApp number" hint="Use 10 digits or +91 followed by the number. When sharing the PDF, select this client in WhatsApp." error={show("mobile")}>
          <input
            id="client-mobile"
            type="tel"
            className={inputClass}
            inputMode="tel"
            value={client.mobile}
            placeholder="10-digit mobile"
            onChange={(e) => onChange({ mobile: e.target.value })}
          />
        </Field>
        <Field label="Project address">
          <textarea
            className={`${inputClass} h-24 py-2`}
            value={client.address}
            onChange={(e) => onChange({ address: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Quotation number" error={show("quotationNumber")}>
            <input
              className={inputClass}
              value={client.quotationNumber}
              onChange={(e) => onChange({ quotationNumber: e.target.value })}
            />
          </Field>
          <Field label="Date" error={show("quotationDate")}>
            <input
              type="date"
              className={inputClass}
              value={client.quotationDate}
              onChange={(e) => onChange({ quotationDate: e.target.value })}
            />
          </Field>
        </div>
      </div>
    </Card>
  );
}
