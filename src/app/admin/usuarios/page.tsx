import { asc, inArray } from "drizzle-orm";
import type { Metadata } from "next";
import { Card, Selo, Titulo } from "@/components/ui";
import { db, schema } from "@/db";
import { exigirPerfil } from "@/lib/auth/dal";
import { dataHora } from "@/lib/formato";
import { FormNovoUsuario, AcoesUsuario } from "./forms";

export const metadata: Metadata = { title: "Usuários" };

export default async function PaginaUsuarios() {
  const eu = await exigirPerfil("ADMIN");
  const usuarios = await db
    .select({
      id: schema.usuarios.id,
      nome: schema.usuarios.nome,
      email: schema.usuarios.email,
      perfil: schema.usuarios.perfil,
      ativo: schema.usuarios.ativo,
      trocarSenha: schema.usuarios.trocarSenha,
      ultimoAcesso: schema.usuarios.ultimoAcesso,
    })
    .from(schema.usuarios)
    .where(inArray(schema.usuarios.perfil, ["ADMIN", "FINANCEIRO"]))
    .orderBy(asc(schema.usuarios.perfil), asc(schema.usuarios.nome));

  return (
    <>
      <Titulo>Usuários internos</Titulo>
      <p className="mb-4 text-sm text-slate-600">
        Administradores e financeiro. O acesso dos consultores é criado na ficha de cada consultor.
      </p>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Usuário</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Último acesso</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{u.nome}</div>
                    <div className="text-xs text-slate-500">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Selo cor={u.perfil === "ADMIN" ? "azul" : "verde"}>
                      {u.perfil === "ADMIN" ? "Admin" : "Financeiro"}
                    </Selo>{" "}
                    {!u.ativo && <Selo cor="cinza">bloqueado</Selo>}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {u.trocarSenha ? "aguardando 1º acesso" : dataHora(u.ultimoAcesso)}
                  </td>
                  <td className="px-4 py-3">
                    {u.id !== eu.id && <AcoesUsuario id={u.id} ativo={u.ativo} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        <Card>
          <h2 className="mb-4 font-semibold text-slate-900">Novo usuário</h2>
          <FormNovoUsuario />
        </Card>
      </div>
    </>
  );
}
