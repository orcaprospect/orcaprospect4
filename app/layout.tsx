import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Orça Prospect — Encontre clientes para o OrçaAI",
    template: "%s · Orça Prospect",
  },
  description:
    "Ferramenta de prospecção B2B: encontre empresas com potencial para automatizar processos de orçamento e organize sua prospecção em um só lugar.",
  applicationName: "Orça Prospect",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4f46e5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
