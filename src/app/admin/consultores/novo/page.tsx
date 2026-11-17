import type { Metadata } from "next";
import Link from "next/link";
import { Card, Titulo } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";
import { criarConsultor } from "../acoes";
import { FormConsultor } from "../form-consultor";

export const metadata: Metadata = { title: "Novo consultor" };

export default async function PaginaNovoConsultor() {
  await exigirPerfil("ADMIN");
  return (
    <>
      <Link href="/admin/consultores" className="text-sm text-slate-600 hover:underline">
        ← Consultores
      </Link>
      <Titulo>Novo consultor</Titulo>
      <Card className="max-w-2xl">
        <FormConsultor acao={criarConsultor} rotuloBotao="Cadastrar" />
      </Card>
    </>
  );
}
