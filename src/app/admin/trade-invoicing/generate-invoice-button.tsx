"use client";

import { useActionState } from "react";
import { generateTradeInvoice, type TradeRunState } from "./actions";

export function GenerateInvoiceButton({
  customerId,
  jobIds,
}: {
  customerId: string;
  jobIds: string[];
}) {
  const initialState: TradeRunState = undefined;
  const [state, formAction, pending] = useActionState(generateTradeInvoice, initialState);

  if (state?.generated) {
    return <span className="text-sm text-green-700">Invoice generated ✓</span>;
  }

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="customer_id" value={customerId} />
      {jobIds.map((id) => (
        <input key={id} type="hidden" name="job_ids" value={id} />
      ))}
      {state?.error && <span className="text-xs text-red-600">{state.error}</span>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-navy-950 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Generating…" : "Generate invoice"}
      </button>
    </form>
  );
}
