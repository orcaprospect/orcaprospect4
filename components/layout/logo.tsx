import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#logo-g)" />
      <rect x="18" y="14" width="28" height="36" rx="5" fill="none" stroke="#fff" strokeWidth="4" />
      <path
        d="M24 32l6 6 12-13"
        stroke="#a5b4fc"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5">
      <LogoMark />
      {!compact && (
        <span className="text-base font-bold tracking-tight text-slate-900">
          Orça<span className="text-indigo-600">Prospect</span>
        </span>
      )}
    </Link>
  );
}
