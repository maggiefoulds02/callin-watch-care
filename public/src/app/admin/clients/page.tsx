import Link from "next/link";
import { listClients } from "@/data/clients";

export default async function ClientsPage({
  searchParams,
}: PageProps<"/admin/clients">) {
  const params = await searchParams;
  const typeFilter = params.type === "trade" || params.type === "retail" ? params.type : undefined;
  const clients = await listClients({ clientType: typeFilter });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl text-navy-950">Clients</h1>
        <Link
          href="/admin/clients/new"
          className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white"
        >
          New client
        </Link>
      </div>

      <div className="mt-4 flex gap-2 text-sm">
        <Link
          href="/admin/clients"
          className={`rounded-full px-3 py-1 ${!typeFilter ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          All
        </Link>
        <Link
          href="/admin/clients?type=retail"
          className={`rounded-full px-3 py-1 ${typeFilter === "retail" ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Retail
        </Link>
        <Link
          href="/admin/clients?type=trade"
          className={`rounded-full px-3 py-1 ${typeFilter === "trade" ? "bg-navy-950 text-white" : "bg-slate-100 text-slate-600"}`}
        >
          Trade
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Terms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {clients.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-400">
                  No clients yet.
                </td>
              </tr>
            )}
            {clients.map((client) => (
              <tr key={client.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${client.id}`}
                    className="font-medium text-navy-950 hover:underline"
                  >
                    {client.full_name}
                  </Link>
                  {client.company_name && (
                    <p className="text-xs text-slate-400">{client.company_name}</p>
                  )}
                </td>
                <td className="px-4 py-3 capitalize">{client.client_type}</td>
                <td className="px-4 py-3">{client.email ?? "—"}</td>
                <td className="px-4 py-3">{client.phone ?? "—"}</td>
                <td className="px-4 py-3">{client.payment_terms_days}d</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
