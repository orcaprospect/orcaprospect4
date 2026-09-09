import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Columns3,
  Download,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";

const STEPS = [
  {
    icon: Search,
    title: "1. Busque com filtros inteligentes",
    text: "Pesquise por segmento, cidade e estado para encontrar empresas que trabalham com pedidos de orçamento.",
  },
  {
    icon: Sparkles,
    title: "2. Identifique oportunidades",
    text: "O score de potencial de automação (0–100) prioriza os leads com mais aderência ao OrçaAI, com base em sinais públicos.",
  },
  {
    icon: Columns3,
    title: "3. Organize seus leads",
    text: "Mova leads entre status, adicione observações e tags e acompanhe sua prospecção em um CRM simples.",
  },
  {
    icon: Download,
    title: "4. Exporte seus contatos comerciais",
    text: "Exporte os leads selecionados em CSV, apenas com os dados comerciais necessários para a abordagem.",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Encontre empresas",
    text: "Busque por segmento, cidade, estado e palavras-chave usando fontes de dados configuráveis (Google Places, OpenStreetMap ou uma API própria).",
  },
  {
    icon: Sparkles,
    title: "Identifique oportunidades",
    text: "Cada empresa recebe um score transparente: WhatsApp público, site, formulário de contato, sinais de orçamento e mais — sempre sinalizando o que não foi possível verificar.",
  },
  {
    icon: Columns3,
    title: "Organize seus leads",
    text: "Um pipeline simples com status Novo → Contatado → Respondeu → Demonstração → Cliente, com favoritos, tags e observações.",
  },
  {
    icon: Download,
    title: "Exporte seus contatos comerciais",
    text: "CSV pronto para o seu time comercial: nome, categoria, cidade, canais de contato e score — sem dados pessoais desnecessários.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-slate-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex" aria-label="Principal">
            <a href="#como-funciona" className="transition hover:text-slate-900">Como funciona</a>
            <a href="#recursos" className="transition hover:text-slate-900">Recursos</a>
            <Link href="/privacidade" className="transition hover:text-slate-900">Privacidade</Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonClasses("ghost", "sm")}>Entrar</Link>
            <Link href="/dashboard" className={buttonClasses("primary", "sm")}>
              Começar prospecção
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(99,102,241,0.12),transparent)]"
          aria-hidden
        />
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-200">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                Prospecção B2B com respeito à LGPD
              </span>
              <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
                Encontre seus próximos <span className="text-indigo-600">clientes</span> para o OrçaAI
              </h1>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
                Encontre empresas com potencial para automatizar seus processos de orçamento e organize sua prospecção em um só lugar.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/dashboard" className={buttonClasses("primary", "lg")}>
                  Começar prospecção
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <a href="#como-funciona" className={buttonClasses("secondary", "lg")}>
                  Ver como funciona
                </a>
              </div>
              <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
                {["Dados públicos de empresas", "Sem envio automático de mensagens", "Exportação LGPD-friendly"].map((t) => (
                  <li key={t} className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" aria-hidden /> {t}
                  </li>
                ))}
              </ul>
            </div>

            {/* Mock visual */}
            <div className="relative hidden lg:block" aria-hidden>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-xl">
                <div className="flex items-center gap-2 pb-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <div className="space-y-3">
                  {[
                    { name: "Empresa Exemplo A", tag: "Marcenaria · Santo André - SP", score: "82 · ALTO", tone: "bg-emerald-50 text-emerald-700 ring-emerald-200" },
                    { name: "Empresa Exemplo B", tag: "Serralheria · São Paulo - SP", score: "64 · MÉDIO", tone: "bg-amber-50 text-amber-700 ring-amber-200" },
                    { name: "Empresa Exemplo C", tag: "Vidraçaria · Curitiba - PR", score: "35 · BAIXO", tone: "bg-slate-100 text-slate-600 ring-slate-200" },
                  ].map((row) => (
                    <div key={row.name} className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                          <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{row.name}</p>
                          <p className="text-xs text-slate-500">{row.tag}</p>
                        </div>
                      </div>
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${row.tone}`}>
                        {row.score}
                      </span>
                    </div>
                  ))}
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {["Novo 12", "Contatado 8", "Cliente 3"].map((s) => (
                      <div key={s} className="rounded-xl bg-indigo-50 px-3 py-2 text-center text-xs font-semibold text-indigo-700">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section id="como-funciona" className="border-t border-slate-100 bg-slate-50 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">Como funciona</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-slate-600">
            Um fluxo simples para transformar buscas públicas em uma carteira de leads organizada.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <step.icon className="h-5 w-5" aria-hidden />
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            Tudo que o seu time de prospecção precisa
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <f.icon className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:px-6">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-14 text-center shadow-xl sm:px-12">
          <h2 className="text-3xl font-bold tracking-tight text-white">
            Pronto para encontrar seus próximos clientes?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            Crie sua conta, faça sua primeira busca e organize seus leads do OrçaAI em minutos.
          </p>
          <Link
            href="/dashboard"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-xl bg-white px-6 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50"
          >
            Começar prospecção
            <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-slate-500 sm:flex-row sm:px-6">
          <Logo />
          <nav className="flex items-center gap-5" aria-label="Rodapé">
            <Link href="/privacidade" className="hover:text-slate-900">Privacidade e LGPD</Link>
            <Link href="/login" className="hover:text-slate-900">Entrar</Link>
          </nav>
        </div>
        <p className="mx-auto mt-6 max-w-3xl px-4 text-center text-xs leading-relaxed text-slate-400 sm:px-6">
          O Orça Prospect trabalha apenas com informações empresariais públicas obtidas de APIs autorizadas.
          Não envia mensagens automáticas e não coleta dados pessoais desnecessários, em conformidade com a LGPD.
        </p>
        <p className="mt-3 text-center text-xs text-slate-400">© 2026 Orça Prospect · Feito para o OrçaAI</p>
      </footer>
    </div>
  );
}
