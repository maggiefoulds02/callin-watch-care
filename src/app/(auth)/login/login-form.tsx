"use client";

import { useActionState } from "react";
import { login, type LoginFormState } from "./actions";

const initialState: LoginFormState = undefined;

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(login, initialState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="sr-only">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
          className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-silver-100 outline-none focus:border-silver-400"
        />
      </div>
      <div>
        <label htmlFor="password" className="sr-only">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Password"
          required
          autoComplete="current-password"
          className="w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-silver-100 outline-none focus:border-silver-400"
        />
      </div>
      {state?.error && <p className="text-sm text-red-300">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm px-6 py-3 text-sm font-medium text-navy-950 disabled:opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
        }}
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
