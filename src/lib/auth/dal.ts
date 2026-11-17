import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import type { Perfil } from "@/db/schema";
import { usuarioDaSessao } from "./sessao";

/**
 * Camada de acesso: toda página e toda server action chama `exigirPerfil`
 * antes de ler ou gravar dados. Layouts sozinhos não bastam como proteção.
 */

export type UsuarioLogado = NonNullable<Awaited<ReturnType<typeof usuarioDaSessao>>>;

/** Uma consulta por requisição, mesmo chamado várias vezes. */
export const obterUsuario = cache(usuarioDaSessao);

export const INICIO_DO_PERFIL: Record<Perfil, string> = {
  ADMIN: "/admin",
  FINANCEIRO: "/financeiro",
  CONSULTOR: "/consultor",
};

export async function exigirUsuario(): Promise<UsuarioLogado> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");
  if (usuario.trocarSenha) redirect("/trocar-senha");
  return usuario;
}

export async function exigirPerfil(...perfis: Perfil[]): Promise<UsuarioLogado> {
  const usuario = await exigirUsuario();
  if (!perfis.includes(usuario.perfil)) redirect(INICIO_DO_PERFIL[usuario.perfil]);
  return usuario;
}

/** Para o perfil consultor: o id do consultor vinculado, ou erro. */
export async function exigirConsultor() {
  const usuario = await exigirPerfil("CONSULTOR");
  if (!usuario.consultorId) throw new Error("Usuário consultor sem cadastro de consultor vinculado.");
  return { ...usuario, consultorId: usuario.consultorId };
}
