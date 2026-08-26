import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";
import { ownerAccountExists } from "@/lib/owner-setup";

export const metadata: Metadata = { title: "Log in — Callin Watch Care" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : "/";
  const needsSetup = !(await ownerAccountExists());

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy-950 px-6 py-20">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          Callin Watch Care
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl text-silver-100">
          Track your restoration
        </h1>
        <p className="mt-2 text-center text-sm text-silver-400">
          Sign in with the email and password Oliver set up for you.
        </p>
        <div className="mt-8">
          <LoginForm next={next} />
        </div>
        {needsSetup && (
          <p className="mt-6 text-center text-sm text-silver-500">
            First time here?{" "}
            <Link href="/setup" className="text-silver-200 underline underline-offset-2">
              Set up the owner account
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
