import Link from "next/link";
import type { ReactNode } from "react";
import { sair } from "@/app/acoes/auth";
import type { Perfil } from "@/db/schema";
import type { UsuarioLogado } from "@/lib/auth/dal";

const MENUS: Record<Perfil, { href: string; rotulo: string }[]> = {
  ADMIN: [
    { href: "/admin", rotulo: "Painel" },
    { href: "/admin/consultores", rotulo: "Consultores" },
    { href: "/admin/periodos", rotulo: "Mês / Lançamentos" },
    { href: "/admin/notas", rotulo: "Notas fiscais" },
    { href: "/admin/relatorios", rotulo: "Relatórios" },
    { href: "/admin/usuarios", rotulo: "Usuários" },
  ],
  FINANCEIRO: [
    { href: "/financeiro", rotulo: "A pagar" },
    { href: "/financeiro/pagos", rotulo: "Pagos" },
  ],
  CONSULTOR: [
    { href: "/consultor", rotulo: "Mês atual" },
    { href: "/consultor/historico", rotulo: "Histórico" },
  ],
};

const NOME_PERFIL: Record<Perfil, string> = {
  ADMIN: "Administrador",
  FINANCEIRO: "Financeiro",
  CONSULTOR: "Consultor",
};

/** Moldura das áreas logadas: cabeçalho com menu do perfil e botão de sair. */
export function Shell({ usuario, children }: { usuario: UsuarioLogado; children: ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <Link href="/" className="font-semibold text-slate-900">
            Consultor Prime
          </Link>
          <nav className="flex flex-1 flex-wrap gap-1 text-sm">
            {MENUS[usuario.perfil].map((m) => (
              <Link
                key={m.href}
                href={m.href}
                className="rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                {m.rotulo}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-right leading-tight">
              <span className="block text-slate-900">{usuario.nome}</span>
              <span className="block text-xs text-slate-500">{NOME_PERFIL[usuario.perfil]}</span>
            </span>
            <Link href="/trocar-senha" className="text-slate-600 hover:underline">
              Senha
            </Link>
            <form action={sair}>
              <button type="submit" className="text-slate-600 hover:underline">
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
