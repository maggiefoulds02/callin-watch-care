import { listClients } from "@/data/clients";
import { JobForm } from "../job-form";

export default async function NewJobPage() {
  const clients = await listClients();

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">New job</h1>
      <div className="mt-6 max-w-3xl rounded border border-slate-200 bg-white p-6">
        <JobForm clients={clients} />
      </div>
    </div>
  );
}
