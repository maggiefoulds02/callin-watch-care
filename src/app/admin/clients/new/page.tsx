import { ClientForm } from "../client-form";
import { createClient } from "../actions";

export default function NewClientPage() {
  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">New client</h1>
      <div className="mt-6 max-w-2xl rounded border border-slate-200 bg-white p-6">
        <ClientForm action={createClient} submitLabel="Create client" />
      </div>
    </div>
  );
}
