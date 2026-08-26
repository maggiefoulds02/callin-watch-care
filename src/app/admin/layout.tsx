import { requireOwner } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard-shell";

const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/jobs", label: "Jobs" },
  { href: "/admin/finance", label: "Finance" },
  { href: "/admin/invoices", label: "Invoices" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // First line of defense for a full page load — proxy.ts only did an
  // optimistic "is there a session at all" check. IMPORTANT: per Next.js's
  // own guidance, a layout does NOT re-run this check on every
  // client-side navigation between /admin/* pages (partial rendering), so
  // this is not sufficient on its own. Every /admin page and every
  // Server Action must independently call requireOwner()/getCurrentProfile()
  // (see src/lib/dal.ts) — and Postgres RLS is the real backstop underneath
  // all of it regardless of what application code remembers to check.
  const profile = await requireOwner();

  return (
    <DashboardShell profile={profile} navLinks={ADMIN_NAV}>
      {children}
    </DashboardShell>
  );
}
