import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ownerAccountExists } from "@/lib/owner-setup";
import { SetupForm } from "./setup-form";

export const metadata: Metadata = { title: "Set up — Callin Watch Care" };

// Nothing here reads cookies/params, so Next would otherwise statically
// prerender this page at build time and freeze the owner-check result —
// meaning it would keep showing the signup form forever, even after Oliver
// completes setup. Force it dynamic so the check runs on every request.
export const dynamic = "force-dynamic";

// One-time bootstrap: the very first visit creates the owner account. Once
// that account exists, this page just sends everyone to /login instead —
// there's only ever one owner, and this route is how that one account gets
// created without anyone touching Supabase directly.
export default async function SetupPage() {
  if (await ownerAccountExists()) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy-950 px-6 py-20">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          Callin Watch Care
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl text-silver-100">
          Set up your account
        </h1>
        <p className="mt-2 text-center text-sm text-silver-400">
          Create the owner account for Callin Watch Care. This only needs doing once.
        </p>
        <div className="mt-8">
          <SetupForm />
        </div>
      </div>
    </div>
  );
}
