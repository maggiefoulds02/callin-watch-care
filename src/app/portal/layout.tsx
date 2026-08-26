import { requireCustomer } from "@/lib/dal";
import { DashboardShell } from "@/components/dashboard-shell";

const PORTAL_NAV = [
  { href: "/portal", label: "My watches" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/account", label: "Account" },
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // See the caveat in src/app/admin/layout.tsx — every /portal page and
  // Server Action must independently verify via src/lib/dal.ts, this
  // layout check is not sufficient on its own across client navigations.
  const profile = await requireCustomer();

  return (
    <DashboardShell profile={profile} navLinks={PORTAL_NAV}>
      {children}
    </DashboardShell>
  );
}
