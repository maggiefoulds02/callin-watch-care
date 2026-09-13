"use client";

import { useActionState, useRef } from "react";
import { uploadJobPhoto, type PhotoUploadState } from "../actions";

export function PhotoUploadForm({ jobId }: { jobId: string }) {
  const initialState: PhotoUploadState = undefined;
  const action = uploadJobPhoto.bind(null, jobId);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3 rounded border border-dashed border-slate-300 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="stage" className="block text-sm font-medium text-slate-700">
            Stage
          </label>
          <select
            id="stage"
            name="stage"
            defaultValue="during"
            className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="before">Before</option>
            <option value="during">During</option>
            <option value="after">After</option>
          </select>
        </div>
        <div>
          <label htmlFor="file" className="block text-sm font-medium text-slate-700">
            Photo
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept="image/*"
            required
            className="mt-1 w-full text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="caption" className="block text-sm font-medium text-slate-700">
          Caption (optional)
        </label>
        <input
          id="caption"
          name="caption"
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          name="is_visible_to_customer"
          defaultChecked
          className="h-4 w-4 rounded border-slate-300"
        />
        Visible to customer
      </label>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Uploading…" : "Upload photo"}
      </button>
    </form>
  );
}
