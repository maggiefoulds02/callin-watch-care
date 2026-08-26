import Link from "next/link";
import { listUninvoicedTradeJobs } from "@/data/invoices";
import { getClientById } from "@/data/clients";
import { generateAllTradeInvoices } from "./actions";
import { GenerateInvoiceButton } from "./generate-invoice-button";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function mondayOf(d: Date) {
  const day = d.getDay(); // 0 = Sunday
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday;
}

export default async function TradeInvoicingPage({
  searchParams,
}: PageProps<"/admin/trade-invoicing">) {
  const params = await searchParams;
  const now = new Date();

  let start: string;
  let end: string;

  if (typeof params.start === "string" && typeof params.end === "string") {
    start = params.start;
    end = params.end;
  } else {
    const thisMonday = mondayOf(now);
    const thisSunday = new Date(thisMonday);
    thisSunday.setDate(thisMonday.getDate() + 6);
    start = isoDate(thisMonday);
    end = isoDate(thisSunday);
  }

  const jobs = await listUninvoicedTradeJobs(start, end);

  const byClient = new Map<string, typeof jobs>();
  for (const job of jobs) {
    if (!job.customer_id) continue;
    const group = byClient.get(job.customer_id) ?? [];
    group.push(job);
    byClient.set(job.customer_id, group);
  }

  const groups = await Promise.all(
    Array.from(byClient.entries()).map(async ([customerId, clientJobs]) => ({
      client: await getClientById(customerId),
      jobs: clientJobs,
    })),
  );

  const shortcut = (label: string, offsetWeeks: number) => {
    const monday = mondayOf(now);
    monday.setDate(monday.getDate() - offsetWeeks * 7);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return (
      <Link
        key={label}
        href={`/admin/trade-invoicing?start=${isoDate(monday)}&end=${isoDate(sunday)}`}
        className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600 hover:bg-slate-200"
      >
        {label}
      </Link>
    );
  };

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">Trade Invoice Run</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        Rather than invoicing each trade job individually, generate one invoice per trade client
        covering everything they had completed in this date range.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {shortcut("This week", 0)}
        {shortcut("Last week", 1)}
        {shortcut("2 weeks ago", 2)}
        <form className="ml-2 flex items-center gap-2 text-sm">
          <input type="date" name="start" defaultValue={start} className="rounded border border-slate-300 px-2 py-1" />
          <span className="text-slate-400">to</span>
          <input type="date" name="end" defaultValue={end} className="rounded border border-slate-300 px-2 py-1" />
          <button type="submit" className="rounded bg-slate-100 px-3 py-1">
            Go
          </button>
        </form>
      </div>

      {groups.length > 1 && (
        <form action={generateAllTradeInvoices.bind(null, start, end)} className="mt-4">
          <button
            type="submit"
            className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
          >
            Approve all ({groups.length} clients)
          </button>
        </form>
      )}

      <div className="mt-6 space-y-6">
        {groups.length === 0 && (
          <p className="rounded border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">
            No uninvoiced trade jobs completed in this range.
          </p>
        )}
        {groups.map(({ client, jobs: clientJobs }) => {
          const total = clientJobs.reduce(
            (sum, j) =>
              sum + j.polishing_income + j.servicing_income + j.parts_income - j.outsource_cost + j.other_income,
            0,
          );
          return (
            <div key={client?.id ?? "unknown"} className="rounded border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="font-medium text-navy-950">
                  {client?.full_name ?? "Unknown client"}
                  {client?.company_name ? ` (${client.company_name})` : ""}
                </p>
                <GenerateInvoiceButton customerId={client?.id ?? ""} jobIds={clientJobs.map((j) => j.id)} />
              </div>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {clientJobs.map((job) => {
                    const lineTotal =
                      job.polishing_income + job.servicing_income + job.parts_income - job.outsource_cost + job.other_income;
                    return (
                      <tr key={job.id}>
                        <td className="px-4 py-2 font-mono text-xs text-slate-400">{job.job_number}</td>
                        <td className="px-4 py-2">
                          {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") || "Watch"}
                        </td>
                        <td className="px-4 py-2 font-mono">{job.watch_serial_number ?? "—"}</td>
                        <td className="px-4 py-2 text-right font-mono">£{lineTotal.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="border-t border-slate-200 font-mono font-medium">
                    <td colSpan={3} className="px-4 py-2 text-right font-sans">
                      Total
                    </td>
                    <td className="px-4 py-2 text-right">£{total.toFixed(2)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          );
        })}
      </div>
    </div>
  );
}
