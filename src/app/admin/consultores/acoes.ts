"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db, schema } from "@/db";
import { TIPOS_VEICULO, VINCULOS } from "@/db/schema";
import { exigirPerfil } from "@/lib/auth/dal";
import { gerarHash, gerarSenhaProvisoria } from "@/lib/auth/senha";
import { encerrarSessoesDoUsuario } from "@/lib/auth/sessao";
import { normalizarNome } from "@/lib/comissoes/calculo";
import { ehDuplicado } from "@/lib/consultores";
import { type EstadoForm, texto } from "@/lib/form";
import { soDigitos } from "@/lib/formato";

const ConsultorSchema = z.object({
  nome: z.string().min(3, "Informe o nome completo.").max(160),
  cpfCnpj: z
    .string()
    .nullable()
    .transform((v) => (v ? soDigitos(v) : null))
    .refine((v) => v === null || v.length === 11 || v.length === 14, "CPF ou CNPJ inválido."),
  email: z.email("E-mail inválido.").nullable(),
  telefone: z.string().max(30).nullable(),
  pix: z.string().max(160).nullable(),
  tipoVeiculo: z.enum(TIPOS_VEICULO).nullable(),
  vinculo: z.enum(VINCULOS).nullable(),
  observacao: z.string().max(2000).nullable(),
});

function lerConsultor(form: FormData) {
  return ConsultorSchema.safeParse({
    nome: texto(form, "nome")?.toUpperCase() ?? "",
    cpfCnpj: texto(form, "cpfCnpj"),
    email: texto(form, "email")?.toLowerCase() ?? null,
    telefone: texto(form, "telefone"),
    pix: texto(form, "pix"),
    tipoVeiculo: texto(form, "tipoVeiculo"),
    vinculo: texto(form, "vinculo"),
    observacao: texto(form, "observacao"),
  });
}

export async function criarConsultor(_: EstadoForm, form: FormData): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const dados = lerConsultor(form);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  let id: number;
  try {
    id = await db.transaction(async (tx) => {
      const [r] = await tx.insert(schema.consultores).values(dados.data).$returningId();
      // O nome do cadastro também vale como nome de "voluntário" no SGA.
      await tx.insert(schema.consultorNomesSga).values({
        consultorId: r.id,
        nome: dados.data.nome,
        nomeNormalizado: normalizarNome(dados.data.nome),
      });
      return r.id;
    });
  } catch (e) {
    if (ehDuplicado(e)) return { erro: "Já existe um consultor com esse nome no SGA." };
    throw e;
  }
  revalidatePath("/admin/consultores");
  redirect(`/admin/consultores/${id}?criado=1`);
}

export async function atualizarConsultor(
  id: number,
  _: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const dados = lerConsultor(form);
  if (!dados.success) return { erro: dados.error.issues[0].message };

  await db
    .update(schema.consultores)
    .set({ ...dados.data, ativo: form.get("ativo") === "on" })
    .where(eq(schema.consultores.id, id));
  revalidatePath("/admin/consultores");
  revalidatePath(`/admin/consultores/${id}`);
  return { ok: "Dados salvos." };
}

export async function adicionarNomeSga(
  consultorId: number,
  _: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const nome = texto(form, "nome")?.toUpperCase();
  if (!nome) return { erro: "Informe o nome como aparece no SGA." };

  try {
    await db
      .insert(schema.consultorNomesSga)
      .values({ consultorId, nome, nomeNormalizado: normalizarNome(nome) });
  } catch (e) {
    if (ehDuplicado(e)) return { erro: "Esse nome do SGA já pertence a um consultor." };
    throw e;
  }
  revalidatePath(`/admin/consultores/${consultorId}`);
  return { ok: "Nome adicionado." };
}

export async function removerNomeSga(consultorId: number, nomeId: number) {
  await exigirPerfil("ADMIN");
  await db
    .delete(schema.consultorNomesSga)
    .where(
      and(
        eq(schema.consultorNomesSga.id, nomeId),
        eq(schema.consultorNomesSga.consultorId, consultorId),
      ),
    );
  revalidatePath(`/admin/consultores/${consultorId}`);
}

export async function definirIndicador(
  consultorId: number,
  _: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const recebedor = Number(texto(form, "recebedorId") ?? 0);
  const percentual = Number((texto(form, "percentual") ?? "2").replace(",", "."));

  if (!recebedor) {
    await db.delete(schema.indicacoes).where(eq(schema.indicacoes.indicadoId, consultorId));
    revalidatePath(`/admin/consultores/${consultorId}`);
    return { ok: "Indicação removida." };
  }
  if (recebedor === consultorId) return { erro: "O consultor não pode indicar a si mesmo." };
  if (!(percentual > 0 && percentual <= 100)) return { erro: "Percentual inválido." };

  const valores = {
    recebedorId: recebedor,
    indicadoId: consultorId,
    percentual: (percentual / 100).toFixed(4),
    observacao: texto(form, "observacao"),
  };
  await db
    .insert(schema.indicacoes)
    .values(valores)
    .onDuplicateKeyUpdate({
      set: {
        recebedorId: valores.recebedorId,
        percentual: valores.percentual,
        observacao: valores.observacao,
      },
    });
  revalidatePath(`/admin/consultores/${consultorId}`);
  revalidatePath("/admin/consultores");
  return { ok: "Indicação salva." };
}

// ---------------------------------------------------------------------------
// Acesso do consultor ao sistema
// ---------------------------------------------------------------------------

export async function criarAcessoConsultor(
  consultorId: number,
  _: EstadoForm,
  form: FormData,
): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const email = z.email().safeParse(texto(form, "email")?.toLowerCase());
  if (!email.success) return { erro: "Informe um e-mail válido." };

  const [consultor] = await db
    .select({ nome: schema.consultores.nome })
    .from(schema.consultores)
    .where(eq(schema.consultores.id, consultorId));
  if (!consultor) return { erro: "Consultor não encontrado." };

  const senha = gerarSenhaProvisoria();
  try {
    await db.insert(schema.usuarios).values({
      nome: consultor.nome,
      email: email.data,
      senhaHash: await gerarHash(senha),
      perfil: "CONSULTOR",
      consultorId,
      trocarSenha: true,
    });
  } catch (e) {
    if (ehDuplicado(e)) return { erro: "Esse e-mail já é usado por outro usuário." };
    throw e;
  }
  revalidatePath(`/admin/consultores/${consultorId}`);
  return { ok: "Acesso criado.", senhaProvisoria: senha };
}

/** Gera nova senha provisória para qualquer usuário (consultor, financeiro, admin). */
export async function redefinirSenha(usuarioId: number): Promise<EstadoForm> {
  await exigirPerfil("ADMIN");
  const senha = gerarSenhaProvisoria();
  await db
    .update(schema.usuarios)
    .set({ senhaHash: await gerarHash(senha), trocarSenha: true })
    .where(eq(schema.usuarios.id, usuarioId));
  await encerrarSessoesDoUsuario(usuarioId);
  return { ok: "Senha redefinida.", senhaProvisoria: senha };
}

export async function alternarAcesso(usuarioId: number, ativo: boolean, voltarPara: string) {
  const admin = await exigirPerfil("ADMIN");
  if (admin.id === usuarioId && !ativo) return; // não desativa a si mesmo
  await db.update(schema.usuarios).set({ ativo }).where(eq(schema.usuarios.id, usuarioId));
  if (!ativo) await encerrarSessoesDoUsuario(usuarioId);
  revalidatePath(voltarPara);
}
