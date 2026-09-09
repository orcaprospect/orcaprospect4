import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4 text-center">
      <Logo />
      <h1 className="mt-8 text-4xl font-extrabold tracking-tight text-slate-900">404</h1>
      <p className="mt-2 text-slate-600">A página que você procura não existe ou foi movida.</p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={buttonClasses("secondary")}>Ir para o início</Link>
        <Link href="/dashboard" className={buttonClasses("primary")}>Ir para o app</Link>
      </div>
    </div>
  );
}
