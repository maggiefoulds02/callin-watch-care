import { listExpenses, listInvoicesForMonth } from "@/data/finance";
import { EXPENSE_CATEGORY_LABELS, INVOICE_STATUS_LABELS, effectiveInvoiceStatus } from "@/lib/types";
import { ExpenseForm } from "./expense-form";

export default async function FinancePage({ searchParams }: PageProps<"/admin/finance">) {
  const params = await searchParams;
  const month =
    typeof params.month === "string" && /^\d{4}-\d{2}$/.test(params.month)
      ? params.month
      : new Date().toISOString().slice(0, 7);

  const [expenses, invoices] = await Promise.all([
    listExpenses(month),
    listInvoicesForMonth(month),
  ]);

  const totalInvoiced = invoices.reduce((sum, i) => sum + i.total, 0);
  const paidInvoices = invoices.filter((i) => i.status === "paid");
  const totalCollected = paidInvoices.reduce((sum, i) => sum + i.total, 0);
  const oliverEarnings = paidInvoices.reduce((sum, i) => sum + (i.oliver_share_amount ?? 0), 0);
  const shEarnings = paidInvoices.reduce(
    (sum, i) => sum + (i.sweeping_hands_share_amount ?? 0),
    0,
  );
  const totalExpenses = expenses.reduce(
    (sum, e) => sum + (e.is_refund ? -e.net_amount : e.net_amount),
    0,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-navy-950">Finance &amp; expenses</h1>
        <form className="flex items-center gap-2 text-sm">
          <label htmlFor="month">Month</label>
          <input
            id="month"
            name="month"
            type="month"
            defaultValue={month}
            className="rounded border border-slate-300 px-2 py-1"
          />
          <button type="submit" className="rounded bg-slate-100 px-3 py-1">
            Go
          </button>
        </form>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Total invoiced" value={totalInvoiced} />
        <Tile label="Total collected" value={totalCollected} />
        <Tile label="Oliver's earnings" value={oliverEarnings} />
        <Tile label="Sweeping Hands earnings" value={shEarnings} />
        <Tile label="Total expenses" value={totalExpenses} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-lg text-navy-950">Add expense</h2>
          <div className="mt-3">
            <ExpenseForm />
          </div>
        </div>

        <div>
          <h2 className="font-serif text-lg text-navy-950">Expenses this month</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {expenses.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400">No expenses logged this month.</p>
            )}
            {expenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="text-slate-800">{expense.description}</p>
                  <p className="text-xs text-slate-400">
                    {EXPENSE_CATEGORY_LABELS[expense.category]} ·{" "}
                    {new Date(expense.expense_date).toLocaleDateString("en-GB")}
                  </p>
                </div>
                <span className={`font-mono ${expense.is_refund ? "text-green-700" : "text-slate-800"}`}>
                  {expense.is_refund ? "+" : "-"}£{expense.net_amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          <h2 className="mt-8 font-serif text-lg text-navy-950">Invoices this month</h2>
          <div className="mt-3 divide-y divide-slate-100 rounded border border-slate-200 bg-white">
            {invoices.length === 0 && (
              <p className="px-4 py-4 text-sm text-slate-400">No invoices dated this month.</p>
            )}
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-slate-600">{invoice.invoice_number}</span>
                <span className="font-mono">£{invoice.total.toFixed(2)}</span>
                <span className="text-xs text-slate-500">
                  {INVOICE_STATUS_LABELS[effectiveInvoiceStatus(invoice)]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-slate-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 font-mono text-lg text-navy-950">£{value.toFixed(2)}</p>
    </div>
  );
}
