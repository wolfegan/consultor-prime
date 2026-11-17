"use client";

import { useActionState } from "react";
import { entrar } from "@/app/acoes/auth";
import { Aviso, Botao, Campo, Card, Input } from "@/components/ui";

export function FormLogin() {
  const [estado, acao, enviando] = useActionState(entrar, undefined);
  return (
    <Card>
      <form action={acao} className="space-y-4">
        <Campo label="E-mail">
          <Input name="email" type="email" autoComplete="username" required autoFocus />
        </Campo>
        <Campo label="Senha">
          <Input name="senha" type="password" autoComplete="current-password" required />
        </Campo>
        {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        <Botao type="submit" disabled={enviando} className="w-full">
          {enviando ? "Entrando…" : "Entrar"}
        </Botao>
        <p className="text-center text-xs text-slate-500">
          Esqueceu a senha? Peça ao administrador uma senha provisória.
        </p>
      </form>
    </Card>
  );
}
