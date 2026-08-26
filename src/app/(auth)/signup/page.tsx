import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = { title: "Sign up — Callin Watch Care" };

export default function SignupPage() {
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy-950 px-6 py-20">
      <div className="w-full max-w-sm">
        <p className="text-center font-serif text-sm tracking-[0.25em] text-silver-600 uppercase">
          Callin Watch Care
        </p>
        <h1 className="mt-3 text-center font-serif text-2xl text-silver-100">
          Create your account
        </h1>
        <p className="mt-2 text-center text-sm text-silver-400">
          Track your watch&apos;s restoration from start to finish.
        </p>
        <div className="mt-8">
          <SignupForm />
        </div>
        <p className="mt-6 text-center text-sm text-silver-500">
          Already have an account?{" "}
          <Link href="/login" className="text-silver-200 underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
