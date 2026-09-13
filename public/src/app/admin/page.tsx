import Link from "next/link";
import { requireOwner } from "@/lib/dal";
import { getDashboardSummary, getRecentJobs, getRecentActivity } from "@/data/dashboard";
import { getPotBalances } from "@/data/finance";
import { JOB_STATUS_LABELS } from "@/lib/types";

const QUICK_ACTIONS = [
  { href: "/admin/jobs/new", label: "New job" },
  { href: "/admin/clients/new", label: "New client" },
  { href: "/admin/invoices/new", label: "New invoice" },
  { href: "/admin/finance", label: "Add expense" },
  { href: "/admin/trade-invoicing", label: "Weekly trade run" },
];

export default async function AdminDashboardPage() {
  const profile = await requireOwner();
  const [summary, balances, recentJobs, activity] = await Promise.all([
    getDashboardSummary(),
    getPotBalances(),
    getRecentJobs(6),
    getRecentActivity(20),
  ]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">
        Welcome, {profile.full_name ?? profile.email}
      </h1>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
          >
            {action.label}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <Tile label="Active jobs" value={String(summary.activeJobs)} />
        <Tile label="Available to Oliver" value={`£${(balances?.available_to_oliver ?? 0).toFixed(2)}`} />
        <Tile label="Sweeping Hands pot" value={`£${(balances?.sweeping_hands_pot ?? 0).toFixed(2)}`} />
        <Tile label="Bank total" value={`£${(balances?.bank_balance ?? 0).toFixed(2)}`} />
        <Tile
          label="Outstanding"
          value={`${summary.outstandingCount} / £${summary.outstandingValue.toFixed(2)}`}
        />
        <Tile label="Overdue" value={String(summary.overdueCount)} accent={summary.overdueCount > 0} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy-950">Recent jobs</h2>
            <Link href="/admin/jobs" className="text-sm text-navy-950 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {recentJobs.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400">No jobs yet.</p>
            )}
            {recentJobs.map((job) => (
              <Link
                key={job.id}
                href={`/admin/jobs/${job.id}`}
                className="flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-mono text-xs text-slate-400">{job.job_number}</span>{" "}
                  {job.customers?.full_name ?? "—"}
                </span>
                <span className="text-xs text-slate-500">
                  {JOB_STATUS_LABELS[job.current_status]}
                </span>
              </Link>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <h2 className="font-serif text-lg text-navy-950">Pot balances</h2>
            <Link href="/admin/pots" className="text-sm text-navy-950 hover:underline">
              View pots
            </Link>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3 text-center">
            <MiniPot label="Bank" value={balances?.bank_balance ?? 0} />
            <MiniPot label="Sweeping Hands" value={balances?.sweeping_hands_pot ?? 0} />
            <MiniPot label="Oliver" value={balances?.available_to_oliver ?? 0} />
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg text-navy-950">Activity log</h2>
          <ol className="mt-3 space-y-3 rounded border border-slate-200 bg-white p-4">
            {activity.length === 0 && (
              <p className="text-sm text-slate-400">Nothing logged yet.</p>
            )}
            {activity.map((entry) => (
              <li key={entry.id} className="text-sm">
                <p className="text-slate-700">{entry.description}</p>
                <p className="text-xs text-slate-400">
                  {new Date(entry.created_at).toLocaleString("en-GB")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded border bg-white p-4 ${accent ? "border-red-300 bg-red-50" : "border-slate-200"}`}
    >
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 font-mono text-lg ${accent ? "text-red-700" : "text-navy-950"}`}>
        {value}
      </p>
    </div>
  );
}

function MiniPot({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-mono text-sm text-navy-950">£{value.toFixed(2)}</p>
    </div>
  );
}
