"use client";

import {
  Columns3,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo, LogoMark } from "@/components/layout/logo";
import { cn, initials } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/search", label: "Encontrar empresas", icon: Search },
  { href: "/leads", label: "Leads", icon: Columns3 },
  { href: "/favorites", label: "Favoritos", icon: Star },
  { href: "/settings", label: "Configurações", icon: Settings },
];

interface AppShellProps {
  user: { name: string; email: string };
  demoMode: boolean;
  children: React.ReactNode;
}

export function AppShell({ user, demoMode, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenu, setUserMenu] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setUserMenu(false);
  }, [pathname]);

  const logout = async () => {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  };

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Navegação principal">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
              active
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className={cn("h-[18px] w-[18px]", active ? "text-indigo-600" : "text-slate-400")} aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-5">
          <Logo href="/dashboard" />
        </div>
        {nav}
        <div className="border-t border-slate-100 p-3">
          {demoMode && (
            <div className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium leading-snug text-amber-700 ring-1 ring-inset ring-amber-200">
              Modo demonstração ativo — resultados fictícios.
            </div>
          )}
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <Settings className="h-4 w-4 text-slate-400" aria-hidden />
            Configurações
          </Link>
        </div>
      </aside>

      {/* Sidebar mobile (drawer) */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMenuOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4">
              <Logo href="/dashboard" />
              <button
                onClick={() => setMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="border-t border-slate-100 p-3">
              {demoMode && (
                <div className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-medium leading-snug text-amber-700">
                  Modo demonstração ativo.
                </div>
              )}
              <button
                onClick={logout}
                className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4 text-slate-400" aria-hidden /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Conteúdo */}
      <div className="lg:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
                aria-label="Abrir menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard" className="lg:hidden">
                <LogoMark className="h-7 w-7" />
              </Link>
              {demoMode && (
                <Badge tone="amber" className="hidden sm:inline-flex">
                  DADOS DE DEMONSTRAÇÃO
                </Badge>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => setUserMenu((v) => !v)}
                className="flex items-center gap-2.5 rounded-xl p-1.5 transition hover:bg-slate-100"
                aria-haspopup="menu"
                aria-expanded={userMenu}
              >
                <div className="hidden text-right sm:block">
                  <p className="max-w-[160px] truncate text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="max-w-[160px] truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 text-sm font-bold text-white">
                  {initials(user.name)}
                </div>
              </button>
              {userMenu && (
                <div
                  className="absolute right-0 top-full z-30 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
                  role="menu"
                >
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    role="menuitem"
                  >
                    <Settings className="h-4 w-4 text-slate-400" aria-hidden /> Configurações
                  </Link>
                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    role="menuitem"
                  >
                    <LogOut className="h-4 w-4" aria-hidden /> Sair
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
