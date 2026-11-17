"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { exigirPerfil } from "@/lib/auth/dal";
import { gerarHash, gerarSenhaProvisoria } from "@/lib/auth/senha";
import { ehDuplicado } from "@/lib/consultores";
import { type EstadoForm, texto } from "@/lib/form";

const UsuarioSchema = z.object({
  nome: z.string().min(2, "Informe o nome."),
  email: z.email("E-mail inválido."),
  perfil: z.enum(["ADMIN", "FINANCEIRO"], "Escolha o perfil."),
});

/** Cria usuário interno (admin ou financeiro). Consultores ganham acesso pela tela do consultor. */
export async function criarUsuarioInterno(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const dados = UsuarioSchema.safeParse({
    nome: texto(form, "nome"),
    email: texto(form, "email")?.toLowerCase(),
    perfil: texto(form, "perfil"),
  });
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const senha = gerarSenhaProvisoria();
  try {
    await db.insert(schema.usuarios).values({
      ...dados.data,
      senhaHash: await gerarHash(senha),
      trocarSenha: true,
    });
  } catch (e) {
    if (ehDuplicado(e)) return { erro: "Esse e-mail já é usado por outro usuário." };
    throw e;
  }
  revalidatePath("/admin/usuarios");
  return { ok: `Usuário ${dados.data.email} criado.`, senhaProvisoria: senha };
}
