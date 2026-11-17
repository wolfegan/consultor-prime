"use client";

import { useActionState, useRef } from "react";
import { Aviso, Botao, Campo, Input, Select } from "@/components/ui";
import { SenhaProvisoria } from "@/components/senha-provisoria";
import {
  adicionarNomeSga,
  alternarAcesso,
  criarAcessoConsultor,
  definirIndicador,
  redefinirSenha,
} from "../acoes";

export function FormNomeSga({ consultorId }: { consultorId: number }) {
  const ref = useRef<HTMLFormElement>(null);
  const [estado, enviar, enviando] = useActionState(
    async (anterior: Parameters<typeof adicionarNomeSga>[1], form: FormData) => {
      const r = await adicionarNomeSga(consultorId, anterior, form);
      if (r?.ok) ref.current?.reset();
      return r;
    },
    undefined,
  );
  return (
    <form ref={ref} action={enviar} className="space-y-2">
      <div className="flex gap-2">
        <Input name="nome" placeholder="Nome exatamente como no SGA" required />
        <Botao type="submit" variante="secundario" disabled={enviando}>
          Adicionar
        </Botao>
      </div>
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
    </form>
  );
}

export function FormIndicador({
  consultorId,
  opcoes,
  recebedorId,
  percentual,
}: {
  consultorId: number;
  opcoes: { id: number; nome: string }[];
  recebedorId: number | null;
  percentual: number;
}) {
  const [estado, enviar, enviando] = useActionState(
    definirIndicador.bind(null, consultorId),
    undefined,
  );
  return (
    <form action={enviar} className="space-y-3">
      <Campo label="Indicado por">
        <Select name="recebedorId" defaultValue={recebedorId ?? ""}>
          <option value="">Ninguém</option>
          {opcoes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </Select>
      </Campo>
      <Campo label="Percentual (%)">
        <Input
          name="percentual"
          defaultValue={String(percentual).replace(".", ",")}
          inputMode="decimal"
          className="max-w-24"
        />
      </Campo>
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <Botao type="submit" variante="secundario" disabled={enviando}>
        Salvar indicação
      </Botao>
    </form>
  );
}

export function FormAcesso({
  consultorId,
  emailSugerido,
  usuario,
}: {
  consultorId: number;
  emailSugerido: string | null;
  usuario: { id: number; ativo: boolean } | null;
}) {
  const [criado, criar, criando] = useActionState(
    criarAcessoConsultor.bind(null, consultorId),
    undefined,
  );
  const [redefinido, redefinir, redefinindo] = useActionState(
    () => redefinirSenha(usuario!.id),
    undefined,
  );
  const senha = criado?.senhaProvisoria ?? redefinido?.senhaProvisoria;

  if (!usuario) {
    return (
      <form action={criar} className="space-y-3">
        <Campo label="E-mail de login">
          <Input name="email" type="email" defaultValue={emailSugerido ?? ""} required />
        </Campo>
        {criado?.erro && <Aviso tipo="erro">{criado.erro}</Aviso>}
        <Botao type="submit" disabled={criando}>
          Criar acesso
        </Botao>
      </form>
    );
  }

  return (
    <div className="space-y-3">
      {senha && <SenhaProvisoria senha={senha} />}
      <div className="flex flex-wrap gap-2">
        <form action={redefinir}>
          <Botao type="submit" variante="secundario" disabled={redefinindo}>
            Gerar nova senha
          </Botao>
        </form>
        <form
          action={alternarAcesso.bind(
            null,
            usuario.id,
            !usuario.ativo,
            `/admin/consultores/${consultorId}`,
          )}
        >
          <Botao type="submit" variante={usuario.ativo ? "perigo" : "secundario"}>
            {usuario.ativo ? "Bloquear acesso" : "Desbloquear acesso"}
          </Botao>
        </form>
      </div>
    </div>
  );
}
