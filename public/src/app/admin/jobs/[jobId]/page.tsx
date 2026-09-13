import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  getJobByIdAdmin,
  getFullTimelineForJob,
  getPhotosForJobAdmin,
  getChecklistForJob,
  getSignedPhotoUrlsAdmin,
} from "@/data/jobs-admin";
import { getClientById } from "@/data/clients";
import { JOB_STATUS_LABELS } from "@/lib/types";
import { StatusUpdateForm } from "./status-form";
import { Checklist } from "./checklist";
import { PhotoUploadForm } from "./photo-upload-form";

export default async function JobDetailPageAdmin({
  params,
}: PageProps<"/admin/jobs/[jobId]">) {
  const { jobId } = await params;
  const job = await getJobByIdAdmin(jobId);
  if (!job) notFound();

  const [timeline, photos, checklist, client] = await Promise.all([
    getFullTimelineForJob(jobId),
    getPhotosForJobAdmin(jobId),
    getChecklistForJob(jobId),
    job.customer_id ? getClientById(job.customer_id) : Promise.resolve(null),
  ]);

  const photoUrls = await getSignedPhotoUrlsAdmin(photos.map((p) => p.storage_path));
  const totalIncome =
    job.polishing_income + job.servicing_income + job.parts_income + job.other_income;

  return (
    <div>
      <p className="text-xs text-slate-400">
        <Link href="/admin/jobs" className="hover:underline">
          Jobs
        </Link>
        {" / "}
        {job.job_number}
      </p>
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy-950">
          {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") || "Watch"}
        </h1>
        <span className="rounded-full bg-navy-950 px-3 py-1 text-xs text-white">
          {JOB_STATUS_LABELS[job.current_status]}
        </span>
      </div>
      <p className="text-sm text-slate-500">
        {job.job_number} · <span className="capitalize">{job.job_type.replace("_", " ")}</span>
        {client && (
          <>
            {" · "}
            <Link href={`/admin/clients/${client.id}`} className="hover:underline">
              {client.full_name}
            </Link>
          </>
        )}
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="font-serif text-lg text-navy-950">Watch details</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded border border-slate-200 bg-white p-4 text-sm sm:grid-cols-3">
              <Detail label="Serial number" value={job.watch_serial_number} />
              <Detail label="Movement" value={job.watch_movement} />
              <Detail label="Case material" value={job.watch_case_material} />
              <Detail label="Strap / bracelet" value={job.watch_strap_bracelet} />
              <Detail label="Customer reference" value={job.customer_reference} />
              <Detail
                label="Expected return"
                value={
                  job.expected_return_date
                    ? new Date(job.expected_return_date).toLocaleDateString("en-GB")
                    : null
                }
              />
            </dl>
            {job.intake_notes && (
              <p className="mt-2 text-sm text-slate-600">{job.intake_notes}</p>
            )}
          </section>

          <section>
            <h2 className="font-serif text-lg text-navy-950">Financials</h2>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 rounded border border-slate-200 bg-white p-4 font-mono text-sm sm:grid-cols-3">
              <Detail label="Polishing" value={`£${job.polishing_income.toFixed(2)}`} />
              <Detail label="Servicing" value={`£${job.servicing_income.toFixed(2)}`} />
              <Detail label="Parts" value={`£${job.parts_income.toFixed(2)}`} />
              <Detail label="Outsource cost" value={`£${job.outsource_cost.toFixed(2)}`} />
              <Detail label="Other" value={`£${job.other_income.toFixed(2)}`} />
              <Detail label="Total" value={`£${totalIncome.toFixed(2)}`} />
            </dl>
            <p className="mt-2 text-xs text-slate-400">
              {job.invoiced ? "Linked to an invoice." : "Not yet invoiced."}
            </p>
          </section>

          <section>
            <h2 className="font-serif text-lg text-navy-950">Checklist</h2>
            <div className="mt-3 rounded border border-slate-200 bg-white p-4">
              <Checklist jobId={jobId} items={checklist} />
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg text-navy-950">Photos</h2>
            <div className="mt-3 space-y-4">
              <PhotoUploadForm jobId={jobId} />
              {photos.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {photos.map((photo) => {
                    const url = photoUrls[photo.storage_path];
                    if (!url) return null;
                    return (
                      <figure key={photo.id}>
                        <Image
                          src={url}
                          alt={photo.caption ?? `${photo.stage} photo`}
                          width={300}
                          height={300}
                          className="aspect-square w-full rounded object-cover"
                        />
                        <figcaption className="mt-1 text-xs text-slate-500">
                          <span className="capitalize">{photo.stage}</span>
                          {photo.caption ? ` — ${photo.caption}` : ""}
                          {!photo.is_visible_to_customer && (
                            <span className="ml-1 text-slate-400">(internal only)</span>
                          )}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="font-serif text-lg text-navy-950">Timeline</h2>
            <ol className="mt-3 space-y-4 border-l border-slate-200 pl-6">
              {timeline.length === 0 && (
                <p className="text-sm text-slate-400">No updates logged yet.</p>
              )}
              {timeline.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute top-1.5 -left-[29px] h-2.5 w-2.5 rounded-full bg-navy-950" />
                  <p className="text-sm font-medium text-navy-950">
                    {JOB_STATUS_LABELS[event.status]}
                  </p>
                  <p className="text-xs text-slate-400">
                    {new Date(event.occurred_at).toLocaleString("en-GB")}
                  </p>
                  {event.note && <p className="mt-1 text-sm text-slate-600">{event.note}</p>}
                  {event.internal_note && (
                    <p className="mt-1 text-sm text-amber-700">
                      Internal: {event.internal_note}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div>
          <div className="sticky top-6 rounded border border-slate-200 bg-white p-4">
            <StatusUpdateForm jobId={jobId} currentStatus={job.current_status} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-slate-800">{value || "—"}</dd>
    </div>
  );
}
