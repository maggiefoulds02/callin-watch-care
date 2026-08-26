import { requireOwner } from "@/lib/dal";

export default async function AdminDashboardPage() {
  const profile = await requireOwner();

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">
        Welcome, {profile.full_name ?? profile.email}
      </h1>
      <p className="mt-2 text-slate-600">
        This is the owner dashboard shell. Customers, jobs, finance, and
        invoices are built out in Phases 2, 4, and 5.
      </p>
    </div>
  );
}
