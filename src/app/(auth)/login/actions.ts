"use server";

import * as z from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const EmailSchema = z.email({ error: "Please enter a valid email." });

export type LoginFormState =
  | { error?: string; success?: boolean }
  | undefined;

/**
 * Passwordless login: sends a magic link. There's no public signup route —
 * customer accounts only exist because the owner created them (see
 * src/data/customers.ts, Phase 2), so signInWithOtp here only succeeds for
 * emails that already have a Supabase auth user.
 */
export async function requestMagicLink(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = formData.get("email");
  const next = (formData.get("next") as string) || "/";

  const validated = EmailSchema.safeParse(email);
  if (!validated.success) {
    return { error: "Please enter a valid email." };
  }

  const supabase = await createSupabaseServerClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { error } = await supabase.auth.signInWithOtp({
    email: validated.data,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      // Do not auto-create a user on signInWithOtp — accounts are
      // provisioned only by the owner (via the admin client). See the
      // "no public signup" decision in the plan doc's route map.
      shouldCreateUser: false,
    },
  });

  if (error) {
    // Supabase returns a generic-looking error for "user not found" here
    // too — deliberately don't reveal whether the email exists.
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
