import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoiceById, getLinksForInvoice } from "@/data/invoices";
import { getClientById } from "@/data/clients";
import { INVOICE_STATUS_LABELS, effectiveInvoiceStatus } from "@/lib/types";
import { markInvoiceSent, markInvoicePaid } from "../actions";

export default async function InvoiceDetailPage({
  params,
}: PageProps<"/admin/invoices/[invoiceId]">) {
  const { invoiceId } = await params;
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) notFound();

  const [links, client] = await Promise.all([
    getLinksForInvoice(invoiceId),
    invoice.customer_id ? getClientById(invoice.customer_id) : Promise.resolve(null),
  ]);

  const status = effectiveInvoiceStatus(invoice);
  const markSent = markInvoiceSent.bind(null, invoiceId);
  const markPaid = markInvoicePaid.bind(null, invoiceId);

  return (
    <div>
      <p className="text-xs text-slate-400">
        <Link href="/admin/invoices" className="hover:underline">
          Invoices
        </Link>
        {" / "}
        {invoice.invoice_number}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy-950">{invoice.invoice_number}</h1>
        <span className="rounded-full bg-navy-950 px-3 py-1 text-xs text-white">
          {INVOICE_STATUS_LABELS[status]}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        {client ? (
          <Link href={`/admin/clients/${client.id}`} className="hover:underline">
            {client.full_name}
            {client.company_name ? ` (${client.company_name})` : ""}
          </Link>
        ) : (
          "No client linked"
        )}
        {" · "}
        Issued {new Date(invoice.issue_date).toLocaleDateString("en-GB")}
      </p>

      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Watch</th>
              <th className="px-4 py-3">Polishing</th>
              <th className="px-4 py-3">Servicing</th>
              <th className="px-4 py-3">Parts</th>
              <th className="px-4 py-3">Outsource</th>
              <th className="px-4 py-3">Other</th>
              <th className="px-4 py-3">Line total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono">
            {links.map((link) => (
              <tr key={link.id}>
                <td className="px-4 py-3 font-sans">
                  {link.jobs ? (
                    <Link href={`/admin/jobs/${link.jobs.id}`} className="text-navy-950 hover:underline">
                      {link.jobs.job_number}
                    </Link>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3 font-sans">
                  {link.jobs
                    ? [link.jobs.watch_brand, link.jobs.watch_model].filter(Boolean).join(" ") || "Watch"
                    : "—"}
                </td>
                <td className="px-4 py-3">£{link.polishing_amount.toFixed(2)}</td>
                <td className="px-4 py-3">£{link.servicing_amount.toFixed(2)}</td>
                <td className="px-4 py-3">£{link.parts_amount.toFixed(2)}</td>
                <td className="px-4 py-3">-£{link.outsource_cost_amount.toFixed(2)}</td>
                <td className="px-4 py-3">£{link.other_amount.toFixed(2)}</td>
                <td className="px-4 py-3">£{link.line_total.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200 font-mono font-medium">
              <td colSpan={7} className="px-4 py-3 text-right font-sans">
                Grand total
              </td>
              <td className="px-4 py-3">£{invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {invoice.status === "paid" && (
        <div className="mt-4 grid gap-4 rounded border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Oliver&apos;s share</p>
            <p className="font-mono text-lg text-navy-950">
              £{(invoice.oliver_share_amount ?? 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Sweeping Hands share</p>
            <p className="font-mono text-lg text-navy-950">
              £{(invoice.sweeping_hands_share_amount ?? 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">Business pot</p>
            <p className="font-mono text-lg text-navy-950">
              £{(invoice.business_pot_amount ?? 0).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      <div className="mt-6 flex gap-3">
        {invoice.status === "pending_review" && (
          <form action={markSent}>
            <button
              type="submit"
              className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
            >
              Mark as sent
            </button>
          </form>
        )}
        {(invoice.status === "sent" || status === "overdue") && (
          <form action={markPaid}>
            <button
              type="submit"
              className="rounded bg-green-700 px-4 py-2 text-sm font-medium text-white"
            >
              Mark as paid
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
