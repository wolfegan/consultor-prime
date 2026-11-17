"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { INICIO_DO_PERFIL, obterUsuario } from "@/lib/auth/dal";
import { SENHA_MINIMA } from "@/lib/auth/regras";
import { conferirSenha, gerarHash } from "@/lib/auth/senha";
import { criarSessao, encerrarSessao, encerrarSessoesDoUsuario } from "@/lib/auth/sessao";
import type { EstadoForm } from "@/lib/form";

// Limite simples de tentativas por e-mail (memória do processo).
const tentativas = new Map<string, { n: number; ate: number }>();
const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 15 * 60 * 1000;

const LoginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  senha: z.string().min(1),
});

export async function entrar(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const dados = LoginSchema.safeParse({ email: form.get("email"), senha: form.get("senha") });
  if (!dados.success) return { erro: "Informe e-mail e senha." };
  const { email, senha } = dados.data;

  const t = tentativas.get(email);
  if (t && t.n >= MAX_TENTATIVAS && t.ate > Date.now()) {
    return { erro: "Muitas tentativas. Aguarde 15 minutos e tente de novo." };
  }

  const [usuario] = await db
    .select()
    .from(schema.usuarios)
    .where(eq(schema.usuarios.email, email))
    .limit(1);

  const valido = usuario?.ativo && (await conferirSenha(senha, usuario.senhaHash));
  if (!usuario || !valido) {
    const atual = t && t.ate > Date.now() ? t.n : 0;
    tentativas.set(email, { n: atual + 1, ate: Date.now() + BLOQUEIO_MS });
    return { erro: "E-mail ou senha incorretos." };
  }

  tentativas.delete(email);
  await db
    .update(schema.usuarios)
    .set({ ultimoAcesso: new Date() })
    .where(eq(schema.usuarios.id, usuario.id));
  await criarSessao(usuario.id);
  redirect(usuario.trocarSenha ? "/trocar-senha" : INICIO_DO_PERFIL[usuario.perfil]);
}

export async function sair() {
  await encerrarSessao();
  redirect("/login");
}

const TrocaSchema = z
  .object({
    atual: z.string().min(1, "Informe a senha atual."),
    nova: z
      .string()
      .min(SENHA_MINIMA, `A nova senha precisa ter ao menos ${SENHA_MINIMA} caracteres.`),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova === d.confirmacao, "A confirmação não confere com a nova senha.")
  .refine((d) => d.nova !== d.atual, "A nova senha precisa ser diferente da atual.");

export async function trocarSenha(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");

  const dados = TrocaSchema.safeParse({
    atual: form.get("atual"),
    nova: form.get("nova"),
    confirmacao: form.get("confirmacao"),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const [registro] = await db
    .select({ senhaHash: schema.usuarios.senhaHash })
    .from(schema.usuarios)
    .where(eq(schema.usuarios.id, usuario.id));
  if (!(await conferirSenha(dados.data.atual, registro.senhaHash))) {
    return { erro: "Senha atual incorreta." };
  }

  await db
    .update(schema.usuarios)
    .set({ senhaHash: await gerarHash(dados.data.nova), trocarSenha: false })
    .where(eq(schema.usuarios.id, usuario.id));
  // Derruba as outras sessões abertas e começa uma nova.
  await encerrarSessoesDoUsuario(usuario.id);
  await criarSessao(usuario.id);
  redirect(INICIO_DO_PERFIL[usuario.perfil]);
}
