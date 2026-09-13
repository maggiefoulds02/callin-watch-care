import { listClients } from "@/data/clients";
import { listUninvoicedJobs } from "@/data/invoices";
import { NewInvoiceForm } from "./new-invoice-form";

export default async function NewInvoicePage() {
  const [clients, jobs] = await Promise.all([listClients(), listUninvoicedJobs()]);

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">New invoice</h1>
      <div className="mt-6 max-w-2xl rounded border border-slate-200 bg-white p-6">
        <NewInvoiceForm clients={clients} jobs={jobs} />
      </div>
    </div>
  );
}
