import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/layout/logo";
import { buttonClasses } from "@/components/ui/button";

export const metadata = { title: "Privacidade e LGPD" };

const SECTIONS = [
  {
    title: "1. Quais dados tratamos",
    items: [
      "Dados da sua conta: nome, e-mail e senha (armazenada apenas como hash).",
      "Dados de prospecção que você salva: empresas, leads, favoritos, observações, tags e histórico de pesquisas.",
      "Dados empresariais públicos das empresas encontradas (nome, categoria, endereço comercial, canais de contato públicos).",
    ],
  },
  {
    title: "2. De onde vêm os dados",
    items: [
      "Exclusivamente de APIs autorizadas configuradas pelo operador (ex.: Google Places API, OpenStreetMap ou API própria).",
      "Não realizamos scraping invasivo nem coletamos dados de fontes que proíbem esse uso.",
      "No modo demonstração, os dados são fictícios e claramente identificados.",
    ],
  },
  {
    title: "3. Para que usamos",
    items: [
      "Permitir que você identifique e organize potenciais clientes B2B para o OrçaAI.",
      "Nenhuma finalidade publicitária. Não vendemos nem compartilhamos seus dados com terceiros.",
    ],
  },
  {
    title: "4. O que NÃO fazemos",
    items: [
      "Não enviamos mensagens automáticas para as empresas (nenhum tipo de disparo em massa).",
      "Não coletamos dados pessoais desnecessários (a finalidade é estritamente comercial/B2B).",
      "Não afirmamos fatos não verificados: o score é uma estimativa baseada em sinais públicos.",
    ],
  },
  {
    title: "5. Seus direitos (LGPD)",
    items: [
      "A qualquer momento você pode exportar todos os seus dados (JSON) em Configurações → Privacidade.",
      "Você pode apagar todos os seus dados de prospecção em Configurações → Privacidade.",
      "Pode solicitar a exclusão da sua conta; os dados de prospecção associados são removidos.",
    ],
  },
  {
    title: "6. Segurança",
    items: [
      "Senhas armazenadas com hash (scrypt + salt). Cookies de sessão HttpOnly assinados.",
      "Chaves de API ficam apenas no servidor (variáveis de ambiente) — nunca no navegador.",
      "Cada usuário só acessa os próprios leads, favoritos e pesquisas.",
    ],
  },
];

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-100">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <Link href="/dashboard" className={buttonClasses("primary", "sm")}>
            Ir para o app
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Privacidade e LGPD
            </h1>
            <p className="text-sm text-slate-500">
              Como o Orça Prospect trata dados — com transparência e minimização.
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-lg font-semibold text-slate-900">{s.title}</h2>
              <ul className="mt-3 space-y-2">
                {s.items.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 rounded-2xl bg-slate-50 p-4 text-xs leading-relaxed text-slate-500">
          Este documento é uma política de privacidade resumida do MVP do Orça Prospect. Ao operar em produção,
          revise com o encarregado de dados (DPO) da sua organização e detalhe os fluxos conforme os artigos 9º,
          18 e 20 da Lei nº 13.709/2018 (LGPD).
        </p>
      </main>
    </div>
  );
}
