"use client";

import { useActionState } from "react";
import type { BusinessSettings } from "@/lib/types";
import { updateBusinessSettings, type SettingsFormState } from "./actions";

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy-800";
const labelClass = "block text-sm font-medium text-slate-700";

export function SettingsForm({ settings }: { settings: BusinessSettings }) {
  const initialState: SettingsFormState = undefined;
  const [state, formAction, pending] = useActionState(updateBusinessSettings, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state?.errors?.form && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.errors.form[0]}</p>
      )}

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">Trade partner split</legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="trade_partner_name" className={labelClass}>
              Partner name
            </label>
            <input
              id="trade_partner_name"
              name="trade_partner_name"
              defaultValue={settings.trade_partner_name}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="sweeping_hands_polishing_pct" className={labelClass}>
              Polishing share (%)
            </label>
            <input
              id="sweeping_hands_polishing_pct"
              name="sweeping_hands_polishing_pct"
              type="number"
              step="0.01"
              min={0}
              max={100}
              defaultValue={settings.sweeping_hands_polishing_pct}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="sweeping_hands_servicing_pct" className={labelClass}>
              Net servicing share (%)
            </label>
            <input
              id="sweeping_hands_servicing_pct"
              name="sweeping_hands_servicing_pct"
              type="number"
              step="0.01"
              min={0}
              max={100}
              defaultValue={settings.sweeping_hands_servicing_pct}
              className={`${inputClass} font-mono`}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Applied automatically the moment an invoice is marked Paid. Parts/associated costs and
          other income always go 100% to Oliver/the business — only polishing and net servicing
          (servicing minus any outsourced cost) are split.
        </p>
      </fieldset>

      <fieldset className="rounded border border-slate-200 p-4">
        <legend className="px-1 text-sm font-medium text-slate-700">
          Opening balances (one-time)
        </legend>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="opening_bank_balance" className={labelClass}>
              Bank total (£)
            </label>
            <input
              id="opening_bank_balance"
              name="opening_bank_balance"
              type="number"
              step="0.01"
              defaultValue={settings.opening_bank_balance}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="opening_sweeping_hands_balance" className={labelClass}>
              {settings.trade_partner_name} pot (£)
            </label>
            <input
              id="opening_sweeping_hands_balance"
              name="opening_sweeping_hands_balance"
              type="number"
              step="0.01"
              defaultValue={settings.opening_sweeping_hands_balance}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label htmlFor="opening_balance_date" className={labelClass}>
              As of
            </label>
            <input
              id="opening_balance_date"
              name="opening_balance_date"
              type="date"
              defaultValue={settings.opening_balance_date}
              className={inputClass}
            />
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          A one-time starting point — every paid invoice and expense from here on adjusts the pots
          automatically. Only change this if you need to correct the starting figures.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save settings"}
      </button>
      {state?.success && <p className="text-sm text-green-700">Saved.</p>}
    </form>
  );
}
