"use client";

import { useActionState } from "react";
import { createExpense, type ExpenseFormState } from "./actions";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/lib/types";

const inputClass =
  "mt-1 w-full rounded border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-navy-800";
const labelClass = "block text-sm font-medium text-slate-700";

export function ExpenseForm() {
  const initialState: ExpenseFormState = undefined;
  const [state, formAction, pending] = useActionState(createExpense, initialState);

  return (
    <form action={formAction} className="space-y-4 rounded border border-slate-200 bg-white p-4">
      {state?.errors?.form && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">{state.errors.form[0]}</p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className={labelClass}>
            Category
          </label>
          <select id="category" name="category" className={inputClass} defaultValue="general_business">
            {(Object.entries(EXPENSE_CATEGORY_LABELS) as [ExpenseCategory, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </div>
        <div>
          <label htmlFor="net_amount" className={labelClass}>
            Amount (£)
          </label>
          <input
            id="net_amount"
            name="net_amount"
            type="number"
            step="0.01"
            min={0}
            className={`${inputClass} font-mono`}
          />
          {state?.errors?.net_amount && (
            <p className="mt-1 text-sm text-red-600">{state.errors.net_amount[0]}</p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <input id="description" name="description" className={inputClass} />
        {state?.errors?.description && (
          <p className="mt-1 text-sm text-red-600">{state.errors.description[0]}</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="expense_date" className={labelClass}>
            Date
          </label>
          <input
            id="expense_date"
            name="expense_date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="supplier_name" className={labelClass}>
            Supplier
          </label>
          <input id="supplier_name" name="supplier_name" className={inputClass} />
        </div>
        <div>
          <label htmlFor="supplier_invoice_ref" className={labelClass}>
            Supplier invoice ref
          </label>
          <input id="supplier_invoice_ref" name="supplier_invoice_ref" className={inputClass} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input type="checkbox" name="is_refund" className="h-4 w-4 rounded border-slate-300" />
        This is a refund/credit (reverses the pot impact of this category)
      </label>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : "Add expense"}
      </button>
      {state?.success && <p className="text-sm text-green-700">Added.</p>}
    </form>
  );
}
