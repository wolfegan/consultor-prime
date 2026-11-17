import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { cookies } from "next/headers";
import { db, schema } from "@/db";

const COOKIE = "cp_sessao";
const DURACAO_MS = 12 * 60 * 60 * 1000; // 12 horas

const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export async function criarSessao(usuarioId: number) {
  const token = randomBytes(32).toString("base64url");
  const expiraEm = new Date(Date.now() + DURACAO_MS);

  await db.insert(schema.sessoes).values({ id: hashToken(token), usuarioId, expiraEm });
  // Limpa sessões vencidas de vez em quando, sem depender de tarefa agendada.
  await db.delete(schema.sessoes).where(lt(schema.sessoes.expiraEm, new Date()));

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiraEm,
  });
}

/** Usuário dono da sessão atual, ou null. Não faz cache: sempre consulta o banco. */
export async function usuarioDaSessao() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [linha] = await db
    .select({
      id: schema.usuarios.id,
      nome: schema.usuarios.nome,
      email: schema.usuarios.email,
      perfil: schema.usuarios.perfil,
      consultorId: schema.usuarios.consultorId,
      trocarSenha: schema.usuarios.trocarSenha,
    })
    .from(schema.sessoes)
    .innerJoin(schema.usuarios, eq(schema.usuarios.id, schema.sessoes.usuarioId))
    .where(
      and(
        eq(schema.sessoes.id, hashToken(token)),
        gt(schema.sessoes.expiraEm, new Date()),
        eq(schema.usuarios.ativo, true),
      ),
    )
    .limit(1);

  return linha ?? null;
}

export async function encerrarSessao() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.delete(schema.sessoes).where(eq(schema.sessoes.id, hashToken(token)));
  store.delete(COOKIE);
}

/** Derruba todas as sessões de um usuário (troca de senha, desativação). */
export async function encerrarSessoesDoUsuario(usuarioId: number) {
  await db.delete(schema.sessoes).where(eq(schema.sessoes.usuarioId, usuarioId));
}
