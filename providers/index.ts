import { env } from "@/lib/env";
import type { ProviderStatus } from "@/types";
import { CustomProvider } from "./custom";
import { DemoProvider } from "./demo";
import { GooglePlacesProvider } from "./google-places";
import { OpenStreetMapProvider } from "./openstreetmap";
import type { DataProvider } from "./types";

export * from "./types";

/** Mensagem exibida quando nenhuma fonte de dados está configurada. */
export const NOT_CONFIGURED_MESSAGE =
  "Fonte de dados não configurada. Configure uma API compatível para realizar pesquisas reais.";

/**
 * Resolve o provider ativo conforme DATA_PROVIDER:
 *  - "google" | "osm" | "demo" | "custom" → força o provider escolhido
 *  - "auto" (padrão) → demo (se DEMO_MODE) > google > custom > osm
 *  - "none" → null (mensagem de "não configurado")
 */
export function resolveProvider(): DataProvider | null {
  const google = new GooglePlacesProvider(env.googleKey);
  const osm = new OpenStreetMapProvider();
  const demo = new DemoProvider();
  const custom = new CustomProvider(env.customUrl, env.customKey);

  const byId: Record<string, DataProvider> = { google, osm, demo, custom };

  if (env.dataProvider === "none") return null;

  if (env.dataProvider !== "auto") {
    const chosen = byId[env.dataProvider];
    return chosen && chosen.configured() ? chosen : null;
  }

  if (env.demoMode && demo.configured()) return demo;
  if (google.configured()) return google;
  if (custom.configured()) return custom;
  if (env.osmEnabled && osm.configured()) return osm;
  return null;
}

/** Status das fontes para a página de Configurações e banners. */
export function providerStatuses(): ProviderStatus[] {
  const google = new GooglePlacesProvider(env.googleKey);
  const osm = new OpenStreetMapProvider();
  const demo = new DemoProvider();
  const custom = new CustomProvider(env.customUrl, env.customKey);
  const active = resolveProvider();

  const mk = (p: DataProvider): ProviderStatus => ({
    id: p.id,
    label: p.label,
    description: p.description,
    envVars: p.envVars,
    configured: p.configured(),
    active: active?.id === p.id,
  });

  return [
    { ...mk(demo), configured: env.demoMode },
    mk(google),
    mk(custom),
    { ...mk(osm), configured: env.osmEnabled && osm.configured() },
  ];
}
