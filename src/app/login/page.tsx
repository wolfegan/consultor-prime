import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { INICIO_DO_PERFIL, obterUsuario } from "@/lib/auth/dal";
import { FormLogin } from "./form-login";

export const metadata: Metadata = { title: "Entrar" };

export default async function PaginaLogin() {
  const usuario = await obterUsuario();
  if (usuario) redirect(usuario.trocarSenha ? "/trocar-senha" : INICIO_DO_PERFIL[usuario.perfil]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-slate-900">Consultor Prime</h1>
          <p className="text-sm text-slate-600">Comissões e pagamentos de consultores</p>
        </div>
        <FormLogin />
      </div>
    </main>
  );
}
