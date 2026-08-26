import Link from "next/link";
import { JOB_STATUS_LABELS, type Job } from "@/lib/types";

export function ActiveJobBanner({ job }: { job: Job }) {
  const watchName = [job.watch_brand, job.watch_model]
    .filter(Boolean)
    .join(" ") || "Your watch";

  return (
    <Link
      href={`/portal/jobs/${job.id}`}
      className="block border-b border-white/10 bg-navy-900 transition-colors hover:bg-navy-800"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <p className="text-sm text-silver-200">
          <span className="font-serif italic tracking-[0.15em] text-silver-500 uppercase">
            In progress —{" "}
          </span>
          {watchName} is currently{" "}
          <span className="font-medium text-silver-100">
            {JOB_STATUS_LABELS[job.current_status]}
          </span>
        </p>
        <span className="text-sm text-silver-400 underline underline-offset-4">
          View full timeline &rarr;
        </span>
      </div>
    </Link>
  );
}
