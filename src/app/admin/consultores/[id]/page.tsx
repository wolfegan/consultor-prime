import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Aviso, Card, Selo, Titulo } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";
import { obterConsultor, opcoesConsultores } from "@/lib/consultores";
import { dataHora } from "@/lib/formato";
import { atualizarConsultor, removerNomeSga } from "../acoes";
import { FormConsultor } from "../form-consultor";
import { FormAcesso, FormIndicador, FormNomeSga } from "./forms";

export const metadata: Metadata = { title: "Consultor" };

export default async function PaginaConsultor({
  params,
  searchParams,
}: PageProps<"/admin/consultores/[id]">) {
  await exigirPerfil("ADMIN");
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [dados, opcoes] = await Promise.all([obterConsultor(id), opcoesConsultores()]);
  if (!dados) notFound();
  const { consultor, nomesSga, indicacao, indicados, usuario } = dados;
  const criado = (await searchParams).criado === "1";

  return (
    <>
      <Link href="/admin/consultores" className="text-sm text-slate-600 hover:underline">
        ← Consultores
      </Link>
      <Titulo>
        {consultor.nome}{" "}
        {!consultor.ativo && <Selo cor="cinza">inativo</Selo>}
      </Titulo>
      {criado && (
        <div className="mb-4">
          <Aviso tipo="ok">Consultor cadastrado. Confira os nomes do SGA e crie o acesso.</Aviso>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Dados cadastrais</h2>
          <FormConsultor
            acao={atualizarConsultor.bind(null, id)}
            dados={consultor}
            rotuloBotao="Salvar"
          />
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="font-semibold text-slate-900">Nomes no SGA</h2>
            <p className="mb-3 text-xs text-slate-500">
              Como o consultor aparece no campo &quot;voluntário&quot; do relatório do SGA. Se ele assumir a
              base de outra pessoa, adicione aqui o nome antigo.
            </p>
            <ul className="mb-3 divide-y divide-slate-100 text-sm">
              {nomesSga.map((n) => (
                <li key={n.id} className="flex items-center justify-between py-1.5">
                  <span>{n.nome}</span>
                  <form action={removerNomeSga.bind(null, id, n.id)}>
                    <button className="text-xs text-red-700 hover:underline">remover</button>
                  </form>
                </li>
              ))}
              {nomesSga.length === 0 && (
                <li className="py-1.5 text-amber-700">
                  Nenhum nome cadastrado: as comissões Coopercar não serão encontradas.
                </li>
              )}
            </ul>
            <FormNomeSga consultorId={id} />
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Indicação (mononível)</h2>
            <p className="mb-3 text-xs text-slate-500">
              Quem indicou este consultor recebe o percentual sobre o faturamento Coopercar dele.
            </p>
            <FormIndicador
              consultorId={id}
              opcoes={opcoes.filter((o) => o.id !== id)}
              recebedorId={indicacao?.recebedorId ?? null}
              percentual={indicacao ? Number(indicacao.percentual) * 100 : 2}
            />
            {indicados.length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-3 text-sm">
                <p className="mb-1 font-medium text-slate-700">Indicou ({indicados.length}):</p>
                <ul className="space-y-0.5 text-slate-600">
                  {indicados.map((i) => (
                    <li key={i.id}>
                      <Link href={`/admin/consultores/${i.indicadoId}`} className="hover:underline">
                        {i.nome}
                      </Link>{" "}
                      <span className="text-xs text-slate-500">
                        ({(Number(i.percentual) * 100).toLocaleString("pt-BR")}%)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="font-semibold text-slate-900">Acesso ao sistema</h2>
            {usuario && (
              <p className="mt-1 text-xs text-slate-500">
                {usuario.email} · último acesso: {dataHora(usuario.ultimoAcesso)}
                {usuario.trocarSenha && " · aguardando troca da senha provisória"}
              </p>
            )}
            <div className="mt-3">
              <FormAcesso
                consultorId={id}
                emailSugerido={consultor.email}
                usuario={usuario ? { id: usuario.id, ativo: usuario.ativo } : null}
              />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
