"use client";

import { useActionState, useState } from "react";
import type { Customer } from "@/lib/types";
import { createJob, type JobFormState } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy-800";
const labelClass = "block text-sm font-medium text-slate-700";
const moneyInputClass = `${inputClass} font-mono`;

const JOB_TYPES = [
  { value: "client", label: "Client" },
  { value: "trade", label: "Trade" },
  { value: "sweeping_hands", label: "Sweeping Hands" },
  { value: "internal", label: "Internal" },
  { value: "warranty", label: "Warranty" },
  { value: "insurance", label: "Insurance" },
] as const;

export function JobForm({ clients }: { clients: Customer[] }) {
  const initialState: JobFormState = undefined;
  const [state, formAction, pending] = useActionState(createJob, initialState);
  const [jobType, setJobType] = useState<string>("client");

  // Trade job type -> only trade clients are relevant in the picker;
  // everything else defaults to showing retail clients first but allows any.
  const filteredClients =
    jobType === "trade" ? clients.filter((c) => c.client_type === "trade") : clients;

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors?.form && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.errors.form[0]}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="job_type" className={labelClass}>
            Job type
          </label>
          <select
            id="job_type"
            name="job_type"
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className={inputClass}
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="customer_id" className={labelClass}>
            Client
          </label>
          <select id="customer_id" name="customer_id" className={inputClass} defaultValue="">
            <option value="">— None —</option>
            {filteredClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.full_name}
                {c.company_name ? ` (${c.company_name})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Watch details</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="watch_brand" className={labelClass}>
              Brand
            </label>
            <input id="watch_brand" name="watch_brand" className={inputClass} />
          </div>
          <div>
            <label htmlFor="watch_model" className={labelClass}>
              Model / reference
            </label>
            <input id="watch_model" name="watch_model" className={inputClass} />
          </div>
          <div>
            <label htmlFor="watch_serial_number" className={labelClass}>
              Serial number
            </label>
            <input id="watch_serial_number" name="watch_serial_number" className={inputClass} />
          </div>
          <div>
            <label htmlFor="watch_movement" className={labelClass}>
              Movement
            </label>
            <input
              id="watch_movement"
              name="watch_movement"
              placeholder="e.g. Cal. 3135"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="watch_case_material" className={labelClass}>
              Case material
            </label>
            <input id="watch_case_material" name="watch_case_material" className={inputClass} />
          </div>
          <div>
            <label htmlFor="watch_strap_bracelet" className={labelClass}>
              Strap / bracelet
            </label>
            <input id="watch_strap_bracelet" name="watch_strap_bracelet" className={inputClass} />
          </div>
        </div>
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="customer_reference" className={labelClass}>
            Customer reference
          </label>
          <input id="customer_reference" name="customer_reference" className={inputClass} />
        </div>
        <div>
          <label htmlFor="expected_return_date" className={labelClass}>
            Expected return date
          </label>
          <input
            id="expected_return_date"
            name="expected_return_date"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Financials (optional at intake — can be filled in later)
        </legend>
        <div className="grid gap-4 sm:grid-cols-5">
          <MoneyField id="polishing_income" label="Polishing" />
          <MoneyField id="servicing_income" label="Servicing" />
          <MoneyField id="parts_income" label="Parts" />
          <MoneyField id="outsource_cost" label="Outsource cost" />
          <MoneyField id="other_income" label="Other" />
        </div>
      </fieldset>

      <div>
        <label htmlFor="intake_notes" className={labelClass}>
          Intake notes
        </label>
        <textarea id="intake_notes" name="intake_notes" rows={3} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create job"}
      </button>
    </form>
  );
}

function MoneyField({ id, label }: { id: string; label: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label} (£)
      </label>
      <input
        id={id}
        name={id}
        type="number"
        step="0.01"
        min={0}
        defaultValue={0}
        className={moneyInputClass}
      />
    </div>
  );
}
