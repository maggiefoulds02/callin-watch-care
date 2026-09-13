import Image from "next/image";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/dal";

const NAV_LINKS = [
  { href: "/services", label: "Services" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="bg-navy-950">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-5">
        <Link href="/" className="shrink-0">
          <Image
            src="/brand/logo.png"
            alt="Callin Watch Care"
            width={150}
            height={42}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <nav className="flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-silver-200 transition-colors hover:text-silver-100"
            >
              {link.label}
            </Link>
          ))}

          {profile ? (
            <Link
              href={profile.role === "owner" ? "/admin" : "/portal"}
              className="rounded-sm border border-white/30 px-4 py-2 text-sm text-silver-100 transition-colors hover:border-white/60"
            >
              {profile.role === "owner" ? "Admin" : "My watches"}
            </Link>
          ) : (
            <Link
              href="/login"
              className="rounded-sm px-4 py-2 text-sm font-medium text-navy-950 transition-opacity hover:opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
              }}
            >
              Track my watch
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
