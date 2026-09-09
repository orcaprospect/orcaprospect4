"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { buttonClasses } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-500">
        <AlertCircle className="h-7 w-7" aria-hidden />
      </span>
      <h1 className="mt-6 text-2xl font-bold text-slate-900">Algo deu errado</h1>
      <p className="mt-2 max-w-md text-sm text-slate-600">
        Ocorreu um erro inesperado. Tente novamente. Se o problema persistir, verifique as
        variáveis de ambiente e o armazenamento configurado.
      </p>
      {error.digest && <p className="mt-2 text-xs text-slate-400">Ref.: {error.digest}</p>}
      <div className="mt-6 flex gap-2">
        <button onClick={reset} className={buttonClasses("primary")}>Tentar novamente</button>
        <Link href="/dashboard" className={buttonClasses("secondary")}>Ir para o dashboard</Link>
      </div>
    </div>
  );
}
