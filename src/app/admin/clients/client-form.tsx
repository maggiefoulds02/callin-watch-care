"use client";

import { useActionState, useState } from "react";
import type { Customer } from "@/lib/types";
import type { ClientFormState } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy-800";
const labelClass = "block text-sm font-medium text-slate-700";

export function ClientForm({
  client,
  action,
  submitLabel,
}: {
  client?: Customer;
  action: (state: ClientFormState, formData: FormData) => Promise<ClientFormState>;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ClientFormState, FormData>(
    action,
    undefined,
  );
  const [clientType, setClientType] = useState(client?.client_type ?? "retail");

  return (
    <form action={formAction} className="space-y-5">
      {state?.errors?.form && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.errors.form[0]}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="full_name" className={labelClass}>
            Full name
          </label>
          <input
            id="full_name"
            name="full_name"
            defaultValue={client?.full_name}
            className={inputClass}
          />
          {state?.errors?.full_name && (
            <p className="mt-1 text-sm text-red-600">{state.errors.full_name[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="company_name" className={labelClass}>
            Company name
          </label>
          <input
            id="company_name"
            name="company_name"
            defaultValue={client?.company_name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="client_type" className={labelClass}>
            Type
          </label>
          <select
            id="client_type"
            name="client_type"
            value={clientType}
            onChange={(e) => setClientType(e.target.value as "retail" | "trade")}
            className={inputClass}
          >
            <option value="retail">Retail</option>
            <option value="trade">Trade</option>
          </select>
        </div>

        <div>
          <label htmlFor="payment_terms_days" className={labelClass}>
            Payment terms (days)
          </label>
          <input
            id="payment_terms_days"
            name="payment_terms_days"
            type="number"
            min={0}
            defaultValue={client?.payment_terms_days ?? 30}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="email" className={labelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            defaultValue={client?.email ?? ""}
            className={inputClass}
          />
          {state?.errors?.email && (
            <p className="mt-1 text-sm text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="phone" className={labelClass}>
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            defaultValue={client?.phone ?? ""}
            className={inputClass}
          />
        </div>

        {clientType === "trade" && (
          <div>
            <label htmlFor="vat_number" className={labelClass}>
              VAT number
            </label>
            <input
              id="vat_number"
              name="vat_number"
              defaultValue={client?.vat_number ?? ""}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div>
        <label htmlFor="address" className={labelClass}>
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={client?.address ?? ""}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>

      {state?.success && (
        <p className="text-sm text-green-700">Saved.</p>
      )}
    </form>
  );
}
