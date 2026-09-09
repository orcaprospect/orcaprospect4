import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { storeInfo } from "@/lib/store";
import { providerStatuses } from "@/providers";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const db = storeInfo();

  return (
    <SettingsClient
      user={{ name: user.name, email: user.email }}
      providers={providerStatuses()}
      config={{
        storeMode: db.mode,
        usingSupabase: db.usingSupabase,
        databaseConfigured: db.databaseConfigured,
        demoMode: env.demoMode,
        osmEnabled: env.osmEnabled,
        googleConfigured: Boolean(env.googleKey),
        customConfigured: Boolean(env.customUrl),
        sessionSecretSet: env.sessionSecretSet,
        supabaseUrlSet: Boolean(env.supabaseUrl),
        supabaseAnonKeySet: Boolean(env.supabaseAnonKey),
        supabaseServiceKeySet: Boolean(env.supabaseServiceKey),
      }}
    />
  );
}
