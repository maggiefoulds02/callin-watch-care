"use client";

import { useActionState } from "react";
import { submitContactMessage, type ContactFormState } from "./actions";

const initialState: ContactFormState = undefined;

export function ContactForm() {
  const [state, action, pending] = useActionState(
    submitContactMessage,
    initialState,
  );

  if (state?.success) {
    return (
      <p className="rounded border border-white/10 bg-navy-800 p-6 text-silver-200">
        Thank you — your message has been sent. We&apos;ll be in touch soon.
      </p>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="name" className="block text-sm text-silver-300">
          Name
        </label>
        <input
          id="name"
          name="name"
          className="mt-1 w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-silver-100 outline-none focus:border-silver-400"
        />
        {state?.errors?.name && (
          <p className="mt-1 text-sm text-red-300">{state.errors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-silver-300">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="mt-1 w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-silver-100 outline-none focus:border-silver-400"
        />
        {state?.errors?.email && (
          <p className="mt-1 text-sm text-red-300">{state.errors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="message" className="block text-sm text-silver-300">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          className="mt-1 w-full rounded border border-navy-700 bg-navy-800 px-3 py-2 text-silver-100 outline-none focus:border-silver-400"
        />
        {state?.errors?.message && (
          <p className="mt-1 text-sm text-red-300">
            {state.errors.message[0]}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-sm px-6 py-3 text-sm font-medium text-navy-950 disabled:opacity-60"
        style={{
          backgroundImage:
            "linear-gradient(135deg,#f5f7fa 0%,#c9d3de 30%,#eef2f6 50%,#b8c2ce 75%,#e7ecf2 100%)",
        }}
      >
        {pending ? "Sending…" : "Send Message"}
      </button>
    </form>
  );
}
