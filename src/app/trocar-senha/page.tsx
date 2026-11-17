import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { obterUsuario } from "@/lib/auth/dal";
import { FormTrocarSenha } from "./form-trocar-senha";

export const metadata: Metadata = { title: "Trocar senha" };

export default async function PaginaTrocarSenha() {
  const usuario = await obterUsuario();
  if (!usuario) redirect("/login");

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Trocar senha</h1>
          <p className="text-sm text-slate-600">
            {usuario.trocarSenha
              ? "Sua senha é provisória. Crie uma senha pessoal para continuar."
              : `Olá, ${usuario.nome}.`}
          </p>
        </div>
        <FormTrocarSenha />
      </div>
    </main>
  );
}
