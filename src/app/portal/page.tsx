import Link from "next/link";
import { requireCustomer } from "@/lib/dal";
import { getJobsForCurrentCustomer } from "@/data/jobs";
import { JOB_STATUS_LABELS } from "@/lib/types";

export default async function PortalPage() {
  const profile = await requireCustomer();
  const jobs = await getJobsForCurrentCustomer();

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">
        Welcome, {profile.full_name ?? profile.email}
      </h1>

      {jobs.length === 0 ? (
        <p className="mt-4 text-slate-600">
          You don&apos;t have any watches with us yet.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Link
              key={job.id}
              href={`/portal/jobs/${job.id}`}
              className="rounded border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <p className="text-xs text-slate-400">{job.job_number}</p>
              <h2 className="mt-1 font-serif text-lg text-navy-950">
                {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") ||
                  "Watch"}
              </h2>
              <p className="mt-2 inline-block rounded-full bg-navy-950 px-3 py-1 text-xs text-silver-100">
                {JOB_STATUS_LABELS[job.current_status]}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
