import "server-only";
import { asc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/db";

/**
 * Consultas de consultores. Chamadas apenas por páginas/ações que já
 * verificaram o perfil (exigirPerfil).
 */

export async function listarConsultores() {
  const [lista, nomes, inds, acessos] = await Promise.all([
    db.select().from(schema.consultores).orderBy(asc(schema.consultores.nome)),
    db.select().from(schema.consultorNomesSga),
    db.select().from(schema.indicacoes),
    db
      .select({
        consultorId: schema.usuarios.consultorId,
        ativo: schema.usuarios.ativo,
      })
      .from(schema.usuarios)
      .where(eq(schema.usuarios.perfil, "CONSULTOR")),
  ]);

  const nomePorId = new Map(lista.map((c) => [c.id, c.nome]));
  return lista.map((c) => {
    const indicacao = inds.find((i) => i.indicadoId === c.id);
    return {
      ...c,
      nomesSga: nomes.filter((n) => n.consultorId === c.id).map((n) => n.nome),
      indicadoPor: indicacao ? (nomePorId.get(indicacao.recebedorId) ?? null) : null,
      qtdIndicados: inds.filter((i) => i.recebedorId === c.id).length,
      acesso: acessos.find((a) => a.consultorId === c.id) ?? null,
    };
  });
}

export async function obterConsultor(id: number) {
  const [consultor] = await db
    .select()
    .from(schema.consultores)
    .where(eq(schema.consultores.id, id));
  if (!consultor) return null;

  const [nomesSga, [indicacao], indicados, [usuario]] = await Promise.all([
    db
      .select()
      .from(schema.consultorNomesSga)
      .where(eq(schema.consultorNomesSga.consultorId, id))
      .orderBy(asc(schema.consultorNomesSga.nome)),
    db.select().from(schema.indicacoes).where(eq(schema.indicacoes.indicadoId, id)),
    db.select().from(schema.indicacoes).where(eq(schema.indicacoes.recebedorId, id)),
    db
      .select({
        id: schema.usuarios.id,
        email: schema.usuarios.email,
        ativo: schema.usuarios.ativo,
        trocarSenha: schema.usuarios.trocarSenha,
        ultimoAcesso: schema.usuarios.ultimoAcesso,
      })
      .from(schema.usuarios)
      .where(eq(schema.usuarios.consultorId, id)),
  ]);

  const nomesIndicados = indicados.length
    ? await db
        .select({ id: schema.consultores.id, nome: schema.consultores.nome })
        .from(schema.consultores)
        .where(
          inArray(
            schema.consultores.id,
            indicados.map((i) => i.indicadoId),
          ),
        )
    : [];

  return {
    consultor,
    nomesSga,
    indicacao: indicacao ?? null,
    indicados: indicados.map((i) => ({
      ...i,
      nome: nomesIndicados.find((n) => n.id === i.indicadoId)?.nome ?? "?",
    })),
    usuario: usuario ?? null,
  };
}

/** Lista curta para selects (id + nome). */
export async function opcoesConsultores() {
  return db
    .select({ id: schema.consultores.id, nome: schema.consultores.nome })
    .from(schema.consultores)
    .orderBy(asc(schema.consultores.nome));
}

/** Erro de chave única do MySQL (e-mail, nome SGA etc. já usados). */
export function ehDuplicado(erro: unknown): boolean {
  let e: unknown = erro;
  for (let i = 0; i < 3 && e; i++) {
    if ((e as { code?: string }).code === "ER_DUP_ENTRY") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}
