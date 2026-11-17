import { count, eq } from "drizzle-orm";
import Link from "next/link";
import { Card, Titulo } from "@/components/ui";
import { db, schema } from "@/db";
import { exigirPerfil } from "@/lib/auth/dal";
import { listarConsultores } from "@/lib/consultores";

export default async function PainelAdmin() {
  const usuario = await exigirPerfil("ADMIN");
  const [consultores, [{ internos }]] = await Promise.all([
    listarConsultores(),
    db
      .select({ internos: count() })
      .from(schema.usuarios)
      .where(eq(schema.usuarios.perfil, "FINANCEIRO")),
  ]);

  const ativos = consultores.filter((c) => c.ativo);
  const semAcesso = ativos.filter((c) => !c.acesso);
  const semNomeSga = ativos.filter((c) => c.nomesSga.length === 0);
  const semDocumento = ativos.filter((c) => !c.cpfCnpj);

  const pendencias = [
    { qtd: semAcesso.length, texto: "consultores ativos sem acesso ao sistema", href: "/admin/consultores" },
    { qtd: semNomeSga.length, texto: "consultores sem nome do SGA cadastrado", href: "/admin/consultores" },
    { qtd: semDocumento.length, texto: "consultores sem CPF/CNPJ", href: "/admin/consultores" },
    { qtd: internos === 0 ? 1 : 0, texto: "nenhum usuário do financeiro criado", href: "/admin/usuarios" },
  ].filter((p) => p.qtd > 0);

  return (
    <>
      <Titulo>Olá, {usuario.nome.split(" ")[0]}</Titulo>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <p className="text-sm text-slate-500">Consultores ativos</p>
          <p className="text-3xl font-semibold text-slate-900">{ativos.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Com acesso ao sistema</p>
          <p className="text-3xl font-semibold text-slate-900">{ativos.length - semAcesso.length}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Com indicador</p>
          <p className="text-3xl font-semibold text-slate-900">
            {ativos.filter((c) => c.indicadoPor).length}
          </p>
        </Card>
      </div>
      <Card>
        <h2 className="mb-3 font-semibold text-slate-900">Pendências de cadastro</h2>
        {pendencias.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma pendência.</p>
        ) : (
          <ul className="space-y-1 text-sm">
            {pendencias.map((p) => (
              <li key={p.texto}>
                <Link href={p.href} className="text-blue-800 hover:underline">
                  <strong>{p.qtd}</strong> {p.texto}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
