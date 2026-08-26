"use client";

import { useActionState, useState } from "react";
import { setPortalPassword, type PortalAccessState } from "./actions";

function generatePassword() {
  // 10 random alphanumeric characters — easy enough to read aloud or copy
  // into a text message, no ambiguous-looking characters (0/O, 1/l) to
  // avoid transcription mistakes.
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join(
    "",
  );
}

export function PortalAccessForm({
  clientId,
  hasAccount,
}: {
  clientId: string;
  hasAccount: boolean;
}) {
  const action = setPortalPassword.bind(null, clientId);
  const [state, formAction, pending] = useActionState<PortalAccessState, FormData>(
    action,
    undefined,
  );
  const [password, setPassword] = useState("");

  if (state?.password) {
    return (
      <div className="rounded border border-green-200 bg-green-50 p-4 text-sm">
        <p className="text-green-800">
          {hasAccount ? "Password reset." : "Portal access granted."} Share this password with
          the client directly (phone, in person, text) — it won&apos;t be shown again:
        </p>
        <p className="mt-2 rounded bg-white px-3 py-2 font-mono text-base text-navy-950">
          {state.password}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-2">
      <div>
        <label htmlFor="password" className="block text-xs text-slate-500">
          {hasAccount ? "New password" : "Set a password"}
        </label>
        <input
          id="password"
          name="password"
          type="text"
          minLength={8}
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 rounded border border-slate-300 px-3 py-2 text-sm font-mono outline-none focus:border-navy-800"
        />
      </div>
      <button
        type="button"
        onClick={() => setPassword(generatePassword())}
        className="rounded bg-slate-100 px-3 py-2 text-sm text-slate-600 hover:bg-slate-200"
      >
        Generate
      </button>
      <button
        type="submit"
        disabled={pending || password.length < 8}
        className="rounded bg-navy-950 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {pending ? "Saving…" : hasAccount ? "Reset password" : "Grant portal access"}
      </button>
      {state?.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
