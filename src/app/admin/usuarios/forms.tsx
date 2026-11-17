"use client";

import { useActionState } from "react";
import { SenhaProvisoria } from "@/components/senha-provisoria";
import { Aviso, Botao, Campo, Input, Select } from "@/components/ui";
import { alternarAcesso, redefinirSenha } from "../consultores/acoes";
import { criarUsuarioInterno } from "./acoes";

export function FormNovoUsuario() {
  const [estado, enviar, enviando] = useActionState(criarUsuarioInterno, undefined);
  return (
    <form action={enviar} className="space-y-4">
      <Campo label="Nome">
        <Input name="nome" required />
      </Campo>
      <Campo label="E-mail">
        <Input name="email" type="email" required />
      </Campo>
      <Campo label="Perfil">
        <Select name="perfil" defaultValue="FINANCEIRO">
          <option value="FINANCEIRO">Financeiro</option>
          <option value="ADMIN">Administrador</option>
        </Select>
      </Campo>
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      {estado?.senhaProvisoria && <SenhaProvisoria senha={estado.senhaProvisoria} />}
      <Botao type="submit" disabled={enviando}>
        Criar usuário
      </Botao>
    </form>
  );
}

export function AcoesUsuario({ id, ativo }: { id: number; ativo: boolean }) {
  const [estado, redefinir, redefinindo] = useActionState(() => redefinirSenha(id), undefined);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap justify-end gap-2">
        <form action={redefinir}>
          <button className="text-xs text-slate-700 hover:underline" disabled={redefinindo}>
            nova senha
          </button>
        </form>
        <form action={alternarAcesso.bind(null, id, !ativo, "/admin/usuarios")}>
          <button className={`text-xs hover:underline ${ativo ? "text-red-700" : "text-slate-700"}`}>
            {ativo ? "bloquear" : "desbloquear"}
          </button>
        </form>
      </div>
      {estado?.senhaProvisoria && <SenhaProvisoria senha={estado.senhaProvisoria} />}
    </div>
  );
}
