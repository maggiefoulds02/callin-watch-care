import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireOwner } from "@/lib/dal";
import type { BusinessSettings } from "@/lib/types";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  await requireOwner();
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("business_settings")
    .select("*")
    .eq("id", 1)
    .single();

  return (
    <div>
      <h1 className="font-serif text-2xl text-navy-950">Settings</h1>
      <div className="mt-6 max-w-2xl rounded border border-slate-200 bg-white p-6">
        <SettingsForm settings={data as BusinessSettings} />
      </div>
    </div>
  );
}
