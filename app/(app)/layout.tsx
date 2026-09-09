import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) {
    // Sessão ausente/órfã: passa pelo /logout para LIMPAR o cookie antes de
    // mostrar o login (evita loop middleware↔layout = "tela branca").
    redirect("/logout");
  }

  return (
    <ToastProvider>
      <AppShell user={{ name: user.name, email: user.email }} demoMode={env.demoMode}>
        {children}
      </AppShell>
    </ToastProvider>
  );
}
