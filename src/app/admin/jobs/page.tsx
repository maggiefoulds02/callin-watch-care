import Link from "next/link";
import { listJobs } from "@/data/jobs-admin";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types";

const STATUS_FILTERS: { value: JobStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "incoming", label: "Incoming" },
  { value: "booked_in", label: "Booked in" },
  { value: "assessment", label: "Assessment" },
  { value: "waiting_approval", label: "Waiting approval" },
  { value: "waiting_parts", label: "Waiting parts" },
  { value: "in_progress", label: "In progress" },
  { value: "quality_control", label: "Quality control" },
  { value: "ready_collection", label: "Ready for collection" },
  { value: "collected_complete", label: "Collected / complete" },
  { value: "on_hold", label: "On hold" },
];

export default async function JobsPage({ searchParams }: PageProps<"/admin/jobs">) {
  const params = await searchParams;
  const statusParam = typeof params.status === "string" ? params.status : undefined;
  const status = STATUS_FILTERS.some((s) => s.value === statusParam)
    ? (statusParam as JobStatus | "")
    : "";

  const jobs = await listJobs(status ? { status } : undefined);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-navy-950">Jobs</h1>
        <Link
          href="/admin/jobs/new"
          className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
        >
          New job
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s.value}
            href={s.value ? `/admin/jobs?status=${s.value}` : "/admin/jobs"}
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
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Watch</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Received</th>
              <th className="px-4 py-3">Invoiced</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No jobs found.
                </td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="font-mono text-xs text-navy-950 hover:underline"
                  >
                    {job.job_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") || "—"}
                </td>
                <td className="px-4 py-3 capitalize">{job.job_type.replace("_", " ")}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-navy-950 px-2.5 py-1 text-xs text-white">
                    {JOB_STATUS_LABELS[job.current_status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(job.date_received).toLocaleDateString("en-GB")}
                </td>
                <td className="px-4 py-3 text-slate-500">{job.invoiced ? "Yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
