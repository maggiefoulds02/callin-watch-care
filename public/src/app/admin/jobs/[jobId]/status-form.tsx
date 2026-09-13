"use client";

import { useActionState } from "react";
import { JOB_STATUS_LABELS, type JobStatus } from "@/lib/types";
import { updateJobStatus, type JobFormState } from "../actions";

const STATUS_OPTIONS: JobStatus[] = [
  "incoming",
  "booked_in",
  "assessment",
  "waiting_approval",
  "waiting_parts",
  "in_progress",
  "quality_control",
  "ready_collection",
  "collected_complete",
  "on_hold",
  "cancelled",
];

export function StatusUpdateForm({
  jobId,
  currentStatus,
}: {
  jobId: string;
  currentStatus: JobStatus;
}) {
  const initialState: JobFormState = undefined;
  const action = updateJobStatus.bind(null, jobId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700">
          Update status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={currentStatus}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-800"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {JOB_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="note" className="block text-sm font-medium text-slate-700">
          Customer-visible note
        </label>
        <textarea
          id="note"
          name="note"
          rows={2}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-800"
        />
      </div>
      <div>
        <label htmlFor="internal_note" className="block text-sm font-medium text-slate-700">
          Internal note (never shown to the customer)
        </label>
        <textarea
          id="internal_note"
          name="internal_note"
          rows={2}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-navy-800"
        />
      </div>
      {state?.errors?.form && (
        <p className="text-sm text-red-600">{state.errors.form[0]}</p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Updating…" : "Log status update"}
      </button>
      {currentStatus !== "collected_complete" && (
        <p className="text-xs text-slate-400">
          Marking a non-trade job &ldquo;Collected / complete&rdquo; automatically creates a
          pending invoice from its financials.
        </p>
      )}
    </form>
  );
}
