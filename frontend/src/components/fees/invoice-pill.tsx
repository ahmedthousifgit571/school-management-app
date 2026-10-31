import { AlertCircle, CheckCircle2, Clock3, PieChart, type LucideIcon } from "lucide-react";

import { Pill } from "@/components/dashboard/controls";
import type { Tone } from "@/components/dashboard/tone";
import { formatINR } from "@/lib/format";
import { invoiceStatus, type Invoice, type InvoiceStatus } from "@/lib/mock-data";

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: Tone; icon: LucideIcon }> = {
  paid: { label: "Paid", tone: "green", icon: CheckCircle2 },
  partial: { label: "Part paid", tone: "yellow", icon: PieChart },
  pending: { label: "Not due yet", tone: "blue", icon: Clock3 },
  overdue: { label: "Overdue", tone: "peach", icon: AlertCircle },
};

export function InvoicePill({ invoice, showBalance }: { invoice: Invoice; showBalance?: boolean }) {
  const status = INVOICE_STATUS[invoiceStatus(invoice)];
  const balance = invoice.amount - invoice.paid;

  return (
    <Pill tone={status.tone} icon={status.icon}>
      {status.label}
      {showBalance && balance > 0 && ` · ${formatINR(balance)} left`}
    </Pill>
  );
}
