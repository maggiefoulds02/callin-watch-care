"use server";

import * as z from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  name: z.string().trim().min(1, { error: "Please enter your name." }),
  email: z.email({ error: "Please enter a valid email." }).trim(),
  message: z
    .string()
    .trim()
    .min(10, { error: "Message must be at least 10 characters." }),
});

export type ContactFormState = {
  errors?: { name?: string[]; email?: string[]; message?: string[] };
  success?: boolean;
} | undefined;

export async function submitContactMessage(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const validated = ContactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  // Public insert — allowed by the contact_messages_insert_public RLS
  // policy in the migration. No auth required to submit the form.
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("contact_messages")
    .insert(validated.data);

  if (error) {
    return {
      errors: { message: ["Something went wrong. Please try again."] },
    };
  }

  return { success: true };
}
