import { notFound } from "next/navigation";
import Image from "next/image";
import {
  getOwnJobById,
  getPhotosForJob,
  getTimelineForJob,
} from "@/data/jobs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { JOB_STATUS_LABELS } from "@/lib/types";

export default async function JobDetailPage({
  params,
}: PageProps<"/portal/jobs/[jobId]">) {
  const { jobId } = await params;

  const job = await getOwnJobById(jobId);
  if (!job) notFound(); // also covers "belongs to someone else" via RLS

  const [timeline, photos] = await Promise.all([
    getTimelineForJob(jobId),
    getPhotosForJob(jobId),
  ]);

  const photoUrls = await getSignedPhotoUrls(photos.map((p) => p.storage_path));

  return (
    <div>
      <p className="text-xs text-slate-400">{job.job_number}</p>
      <h1 className="mt-1 font-serif text-2xl text-navy-950">
        {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") ||
          "Watch"}
      </h1>
      <p className="mt-2 inline-block rounded-full bg-navy-950 px-3 py-1 text-xs text-silver-100">
        {JOB_STATUS_LABELS[job.current_status]}
      </p>

      {photos.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {photos.map((photo) => {
            const url = photoUrls[photo.storage_path];
            if (!url) return null;
            return (
              <figure key={photo.id}>
                <Image
                  src={url}
                  alt={photo.caption ?? "Photo of your watch during service"}
                  width={300}
                  height={300}
                  className="aspect-square w-full rounded object-cover"
                />
                {photo.caption && (
                  <figcaption className="mt-1 text-xs text-slate-500">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      )}

      <h2 className="mt-10 font-serif text-lg text-navy-950">Timeline</h2>
      <ol className="mt-4 space-y-6 border-l border-slate-200 pl-6">
        {timeline.length === 0 && (
          <p className="text-sm text-slate-500">
            No updates yet — check back soon.
          </p>
        )}
        {timeline.map((event) => (
          <li key={event.id} className="relative">
            <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full bg-navy-950" />
            <p className="text-sm font-medium text-navy-950">
              {JOB_STATUS_LABELS[event.status]}
            </p>
            <p className="text-xs text-slate-400">
              {new Date(event.occurred_at).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
            {event.note && (
              <p className="mt-1 text-sm text-slate-600">{event.note}</p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

async function getSignedPhotoUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.storage
    .from("job-photos")
    .createSignedUrls(paths, 60 * 60); // 1 hour

  const urls: Record<string, string> = {};
  data?.forEach((entry) => {
    if (entry.signedUrl && !entry.error) {
      urls[entry.path ?? ""] = entry.signedUrl;
    }
  });
  return urls;
}
