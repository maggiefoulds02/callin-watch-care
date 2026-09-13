import Link from "next/link";
import { listInvoices } from "@/data/invoices";
import { INVOICE_STATUS_LABELS, effectiveInvoiceStatus, type InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "pending_review", label: "Pending review" },
  { value: "sent", label: "Sent" },
  { value: "paid", label: "Paid" },
  { value: "void", label: "Void" },
];

export default async function InvoicesPage({ searchParams }: PageProps<"/admin/invoices">) {
  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const status = STATUS_FILTERS.some((s) => s.value === statusParam)
    ? (statusParam as InvoiceStatus | "")
    : "";

  const invoices = await listInvoices(status || undefined);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-navy-950">Invoices</h1>
        <Link
          href="/admin/invoices/new"
          className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
        >
          New invoice
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s.value}
            href={s.value ? `/admin/invoices?status=${s.value}` : "/admin/invoices"}
            className={`rounded-full px-3 py-1 ${
              status === s.value ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"
            }`}
          >
            {s.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Issue date</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {invoices.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No invoices found.
                </td>
              </tr>
            )}
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="font-medium text-navy-950 hover:underline"
                  >
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-3 capitalize">{invoice.invoice_type.replace("_", " ")}</td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(invoice.issue_date).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 font-mono">£{invoice.total.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {INVOICE_STATUS_LABELS[effectiveInvoiceStatus(invoice)]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
