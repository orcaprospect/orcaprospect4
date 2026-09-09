import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginClient } from "@/components/auth/login-client";
import { Skeleton } from "@/components/ui/skeleton";
import { env } from "@/lib/env";
import { authMode } from "@/lib/supabase/config";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
          <Skeleton className="h-[420px] w-full max-w-md rounded-3xl" />
        </div>
      }
    >
      <LoginClient demoMode={env.demoMode} authMode={authMode()} />
    </Suspense>
  );
}
