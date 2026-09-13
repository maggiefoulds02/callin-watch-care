import Image from "next/image";
import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { Profile } from "@/lib/types";

export function DashboardShell({
  profile,
  navLinks,
  children,
}: {
  profile: Profile;
  navLinks: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-slate-50 text-slate-900">
      <header className="bg-navy-950">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link href="/" className="shrink-0">
            <Image
              src="/brand/logo.png"
              alt="Callin Watch Care"
              width={130}
              height={36}
              className="h-8 w-auto"
            />
          </Link>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-silver-200 hover:text-silver-100"
              >
                {link.label}
              </Link>
            ))}
            <span className="text-sm text-silver-400">
              {profile.full_name ?? profile.email}
            </span>
            <form action={logout}>
              <button
                type="submit"
                className="text-sm text-silver-400 underline underline-offset-4 hover:text-silver-200"
              >
                Log out
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-10">{children}</div>
      </main>
    </div>
  );
}
