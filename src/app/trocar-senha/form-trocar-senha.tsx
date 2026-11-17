"use client";

import { useActionState } from "react";
import { trocarSenha } from "@/app/acoes/auth";
import { Aviso, Botao, Campo, Card, Input } from "@/components/ui";
import { SENHA_MINIMA } from "@/lib/auth/regras";

export function FormTrocarSenha() {
  const [estado, acao, enviando] = useActionState(trocarSenha, undefined);
  return (
    <Card>
      <form action={acao} className="space-y-4">
        <Campo label="Senha atual">
          <Input name="atual" type="password" autoComplete="current-password" required />
        </Campo>
        <Campo label="Nova senha" dica={`Mínimo de ${SENHA_MINIMA} caracteres.`}>
          <Input
            name="nova"
            type="password"
            autoComplete="new-password"
            minLength={SENHA_MINIMA}
            required
          />
        </Campo>
        <Campo label="Confirme a nova senha">
          <Input name="confirmacao" type="password" autoComplete="new-password" required />
        </Campo>
        {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
        <Botao type="submit" disabled={enviando} className="w-full">
          {enviando ? "Salvando…" : "Salvar nova senha"}
        </Botao>
      </form>
    </Card>
  );
}
