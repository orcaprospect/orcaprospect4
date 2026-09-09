import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/settings/settings-client";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { providerStatuses } from "@/providers";

export const metadata: Metadata = { title: "Configurações" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  return (
    <SettingsClient
      user={{ name: user.name, email: user.email }}
      providers={providerStatuses()}
      config={{
        store: env.store,
        databaseConfigured: Boolean(env.databaseUrl),
        demoMode: env.demoMode,
        osmEnabled: env.osmEnabled,
        googleConfigured: Boolean(env.googleKey),
        customConfigured: Boolean(env.customUrl),
        sessionSecretSet: env.sessionSecretSet,
      }}
    />
  );
}
