import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientById, getJobsForClient, getInvoicesForClient } from "@/data/clients";
import { updateClient } from "../actions";
import { ClientForm } from "../client-form";
import { PortalAccessForm } from "../portal-access-form";
import { JOB_STATUS_LABELS, INVOICE_STATUS_LABELS, effectiveInvoiceStatus } from "@/lib/types";

export default async function ClientDetailPage({
  params,
}: PageProps<"/admin/clients/[clientId]">) {
  const { clientId } = await params;
  const client = await getClientById(clientId);
  if (!client) notFound();

  const [jobs, invoices] = await Promise.all([
    getJobsForClient(clientId),
    getInvoicesForClient(clientId),
  ]);

  const activeJobs = jobs.filter(
    (j) => j.current_status !== "collected_complete" && j.current_status !== "cancelled",
  );
  const totalSpend = invoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + i.total, 0);
  const outstanding = invoices
    .filter((i) => i.status !== "paid" && i.status !== "void")
    .reduce((sum, i) => sum + i.total, 0);

  const updateClientWithId = updateClient.bind(null, clientId);

  return (
    <div>
      <p className="text-xs text-slate-400">
        <Link href="/admin/clients" className="hover:underline">
          Clients
        </Link>
        {" / "}
        {client.full_name}
      </p>
      <h1 className="mt-1 font-serif text-2xl text-navy-950">{client.full_name}</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <SummaryTile label="Active jobs" value={String(activeJobs.length)} />
        <SummaryTile label="Total jobs" value={String(jobs.length)} />
        <SummaryTile label="Total spend" value={`£${totalSpend.toFixed(2)}`} />
        <SummaryTile label="Outstanding" value={`£${outstanding.toFixed(2)}`} />
      </div>

      {client.client_type === "retail" && (
        <div className="mt-8">
          <h2 className="font-serif text-lg text-navy-950">Portal access</h2>
          <p className="mt-1 text-sm text-slate-500">
            {client.user_id
              ? "This client can log in to track their watch. Reset their password if they've lost it."
              : "Give this client a login so they can track their watch's progress themselves."}
          </p>
          <div className="mt-3 max-w-2xl rounded border border-slate-200 bg-white p-4">
            <PortalAccessForm clientId={client.id} hasAccount={Boolean(client.user_id)} />
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-lg text-navy-950">Jobs</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {jobs.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400">No jobs yet.</p>
            )}
            {jobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="text-slate-400">{job.job_number}</span>{" "}
                  {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") || "Watch"}
                </span>
                <span className="text-xs text-slate-500">
                  {JOB_STATUS_LABELS[job.current_status]}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg text-navy-950">Invoices</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {invoices.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400">No invoices yet.</p>
            )}
            {invoices.map((invoice) => (
              <Link
                key={invoice.id}
                href={`/admin/invoices/${invoice.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span className="text-slate-600">{invoice.invoice_number}</span>
                <span className="font-mono">£{invoice.total.toFixed(2)}</span>
                <span className="text-xs text-slate-500">
                  {INVOICE_STATUS_LABELS[effectiveInvoiceStatus(invoice)]}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="font-serif text-lg text-navy-950">Edit details</h2>
        <div className="mt-3 max-w-2xl rounded border border-slate-200 bg-white p-6">
          <ClientForm client={client} action={updateClientWithId} submitLabel="Save changes" />
        </div>
      </div>
    </div>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-xl text-navy-950">{value}</p>
    </div>
  );
}
