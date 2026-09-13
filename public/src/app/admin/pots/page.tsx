import Link from "next/link";
import { getPotBalances, getPotHistory } from "@/data/finance";

export default async function PotsPage() {
  const [balances, history] = await Promise.all([getPotBalances(), getPotHistory()]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">Pots</h1>
      <p className="mt-1 max-w-2xl text-sm text-slate-500">
        All money sits in one bank account (Revolut). This shows what portion belongs to Oliver,
        what belongs to the trade partner, and what&apos;s needed for the business — not a
        complex accounting model, just where the money actually is.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <PotTile label="Bank balance (total)" value={balances?.bank_balance ?? 0} accent="navy" />
        <PotTile
          label="Sweeping Hands pot"
          value={balances?.sweeping_hands_pot ?? 0}
          accent="gold"
        />
        <PotTile
          label="Available to Oliver"
          value={balances?.available_to_oliver ?? 0}
          accent="green"
        />
      </div>

      <div className="mt-6 rounded border border-slate-200 bg-white p-4 text-sm text-slate-600">
        <p>
          To pay out Sweeping Hands, add a{" "}
          <span className="font-medium">Sweeping Hands Withdrawal</span> expense on the{" "}
          <Link href="/admin/finance" className="text-navy-950 underline">
            Finance
          </Link>{" "}
          page — it reduces their pot by that amount. Opening balances and split percentages are
          set in{" "}
          <Link href="/admin/settings" className="text-navy-950 underline">
            Settings
          </Link>
          .
        </p>
      </div>

      <h2 className="mt-8 font-serif text-lg text-navy-950">Pot history</h2>
      <div className="mt-3 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Invoice</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Total paid</th>
              <th className="px-4 py-3">Oliver&apos;s share</th>
              <th className="px-4 py-3">Sweeping Hands share</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No paid invoices yet.
                </td>
              </tr>
            )}
            {history.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 text-slate-500">
                  {invoice.paid_at ? new Date(invoice.paid_at).toLocaleDateString("en-GB") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/invoices/${invoice.id}`}
                    className="text-navy-950 hover:underline"
                  >
                    {invoice.invoice_number}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  {invoice.customers?.full_name ?? "—"}
                  {invoice.customers?.company_name ? ` (${invoice.customers.company_name})` : ""}
                </td>
                <td className="px-4 py-3 font-mono">£{invoice.total.toFixed(2)}</td>
                <td className="px-4 py-3 font-mono">
                  £{(invoice.oliver_share_amount ?? 0).toFixed(2)}
                </td>
                <td className="px-4 py-3 font-mono">
                  £{(invoice.sweeping_hands_share_amount ?? 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PotTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "navy" | "gold" | "green";
}) {
  const accentClass = {
    navy: "border-navy-950",
    gold: "border-amber-500",
    green: "border-green-600",
  }[accent];

  return (
    <div className={`rounded border-l-4 border-slate-200 bg-white p-5 ${accentClass}`}>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-2xl text-navy-950">£{value.toFixed(2)}</p>
    </div>
  );
}
