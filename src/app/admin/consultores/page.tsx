import type { Metadata } from "next";
import Link from "next/link";
import { Card, Input, Selo, Titulo } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";
import { normalizarNome } from "@/lib/comissoes/calculo";
import { listarConsultores } from "@/lib/consultores";
import { formatarDocumento } from "@/lib/formato";

export const metadata: Metadata = { title: "Consultores" };

export default async function PaginaConsultores({ searchParams }: PageProps<"/admin/consultores">) {
  await exigirPerfil("ADMIN");
  const { q, status } = await searchParams;
  const busca = typeof q === "string" ? normalizarNome(q) : "";
  const filtro = status === "inativos" ? "inativos" : status === "todos" ? "todos" : "ativos";

  const todos = await listarConsultores();
  const lista = todos.filter((c) => {
    if (filtro === "ativos" && !c.ativo) return false;
    if (filtro === "inativos" && c.ativo) return false;
    if (!busca) return true;
    return [c.nome, ...c.nomesSga, c.cpfCnpj ?? ""].some((n) => normalizarNome(n).includes(busca));
  });

  return (
    <>
      <Titulo
        acao={
          <Link
            href="/admin/consultores/novo"
            className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"
          >
            Novo consultor
          </Link>
        }
      >
        Consultores
      </Titulo>

      <form className="mb-4 flex flex-wrap gap-2">
        <Input
          name="q"
          defaultValue={typeof q === "string" ? q : ""}
          placeholder="Buscar por nome, nome no SGA ou CPF/CNPJ"
          className="max-w-md"
        />
        <select
          name="status"
          defaultValue={filtro}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
        >
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
        <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-50">
          Filtrar
        </button>
      </form>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Consultor</th>
              <th className="px-4 py-3">CPF/CNPJ</th>
              <th className="px-4 py-3">Vínculo</th>
              <th className="px-4 py-3">Indicado por</th>
              <th className="px-4 py-3">Indicados</th>
              <th className="px-4 py-3">Acesso</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {lista.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <Link href={`/admin/consultores/${c.id}`} className="font-medium text-blue-800 hover:underline">
                    {c.nome}
                  </Link>
                  {!c.ativo && (
                    <span className="ml-2">
                      <Selo cor="cinza">inativo</Selo>
                    </span>
                  )}
                  {c.nomesSga.length === 0 && (
                    <span className="ml-2">
                      <Selo cor="amarelo">sem nome no SGA</Selo>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">{formatarDocumento(c.cpfCnpj) || "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.vinculo ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.indicadoPor ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{c.qtdIndicados || "—"}</td>
                <td className="px-4 py-3">
                  {c.acesso ? (
                    <Selo cor={c.acesso.ativo ? "verde" : "cinza"}>
                      {c.acesso.ativo ? "ativo" : "bloqueado"}
                    </Selo>
                  ) : (
                    <Selo cor="amarelo">sem acesso</Selo>
                  )}
                </td>
              </tr>
            ))}
            {lista.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Nenhum consultor encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
      <p className="mt-2 text-xs text-slate-500">
        {lista.length} de {todos.length} consultores
      </p>
    </>
  );
}
