import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getSessionUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { isStoreError } from "@/lib/store";
import { ToastProvider } from "@/components/ui/toast";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let user;
  try {
    user = await getSessionUser();
  } catch (error) {
    // Falha de infraestrutura (banco fora/arquivo ilegível): página amigável
    // em vez da tela genérica de erro. A sessão do usuário é preservada.
    if (isStoreError(error)) {
      const params = new URLSearchParams({ msg: error.message });
      if (error.hint) params.set("hint", error.hint);
      redirect(`/database-error?${params.toString()}`);
    }
    throw error;
  }
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
