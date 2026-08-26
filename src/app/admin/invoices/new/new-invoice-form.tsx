"use client";

import { useActionState, useMemo, useState } from "react";
import type { Customer, Job } from "@/lib/types";
import { createInvoiceFromJobs, type InvoiceActionState } from "../actions";

export function NewInvoiceForm({ clients, jobs }: { clients: Customer[]; jobs: Job[] }) {
  const initialState: InvoiceActionState = undefined;
  const [state, formAction, pending] = useActionState(createInvoiceFromJobs, initialState);
  const [clientId, setClientId] = useState("");

  const clientsWithJobs = useMemo(() => {
    const ids = new Set(jobs.map((j) => j.customer_id).filter(Boolean));
    return clients.filter((c) => ids.has(c.id));
  }, [clients, jobs]);

  const jobsForClient = jobs.filter((j) => j.customer_id === clientId);
  const total = jobsForClient.reduce(
    (sum, j) => sum + j.polishing_income + j.servicing_income + j.parts_income - j.outsource_cost + j.other_income,
    0,
  );

  if (clientsWithJobs.length === 0) {
    return (
      <p className="rounded border border-slate-200 bg-white p-4 text-sm text-slate-500">
        No uninvoiced non-trade jobs right now. (Trade jobs are billed weekly via Trade
        Invoicing instead.)
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <div>
        <label htmlFor="customer_id" className="block text-sm font-medium text-slate-700">
          Client
        </label>
        <select
          id="customer_id"
          name="customer_id"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">— Choose a client —</option>
          {clientsWithJobs.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name}
              {c.company_name ? ` (${c.company_name})` : ""}
            </option>
          ))}
        </select>
      </div>

      {clientId && (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Uninvoiced jobs</p>
          <div className="divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {jobsForClient.map((job) => {
              const lineTotal =
                job.polishing_income + job.servicing_income + job.parts_income - job.outsource_cost + job.other_income;
              return (
                <label key={job.id} className="flex items-center gap-3 px-4 py-3 text-sm">
                  <input
                    type="checkbox"
                    name="job_ids"
                    value={job.id}
                    defaultChecked
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  <span className="flex-1">
                    <span className="text-slate-400">{job.job_number}</span>{" "}
                    {[job.watch_brand, job.watch_model].filter(Boolean).join(" ") || "Watch"}
                  </span>
                  <span className="font-mono">£{lineTotal.toFixed(2)}</span>
                </label>
              );
            })}
          </div>
          <p className="mt-2 text-right text-sm font-mono text-slate-700">
            Grand total: £{total.toFixed(2)}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={pending || !clientId}
        className="rounded bg-navy-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create invoice"}
      </button>
    </form>
  );
}
