"use client";

import { useActionState } from "react";
import { Aviso, Botao, Campo, Input, Select, Textarea } from "@/components/ui";
import type { EstadoForm } from "@/lib/form";

type Dados = {
  nome: string;
  cpfCnpj: string | null;
  email: string | null;
  telefone: string | null;
  pix: string | null;
  tipoVeiculo: string | null;
  vinculo: string | null;
  observacao: string | null;
  ativo: boolean;
};

export function FormConsultor({
  acao,
  dados,
  rotuloBotao,
}: {
  acao: (estado: EstadoForm, form: FormData) => Promise<EstadoForm>;
  dados?: Dados;
  rotuloBotao: string;
}) {
  const [estado, enviar, enviando] = useActionState(acao, undefined);
  return (
    <form action={enviar} className="space-y-4">
      <Campo label="Nome completo">
        <Input name="nome" defaultValue={dados?.nome} required />
      </Campo>
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo label="CPF ou CNPJ">
          <Input name="cpfCnpj" defaultValue={dados?.cpfCnpj ?? ""} inputMode="numeric" />
        </Campo>
        <Campo label="Chave PIX">
          <Input name="pix" defaultValue={dados?.pix ?? ""} />
        </Campo>
        <Campo label="E-mail de contato">
          <Input name="email" type="email" defaultValue={dados?.email ?? ""} />
        </Campo>
        <Campo label="Telefone">
          <Input name="telefone" defaultValue={dados?.telefone ?? ""} />
        </Campo>
        <Campo label="Tipo de veículo">
          <Select name="tipoVeiculo" defaultValue={dados?.tipoVeiculo ?? ""}>
            <option value="">—</option>
            <option value="MOTO">Moto</option>
            <option value="CARRO">Carro</option>
            <option value="S/V">S/V (sem veículo)</option>
          </Select>
        </Campo>
        <Campo label="Vínculo">
          <Select name="vinculo" defaultValue={dados?.vinculo ?? ""}>
            <option value="">—</option>
            <option value="PJ">PJ</option>
            <option value="CLT">CLT</option>
            <option value="ADM">ADM</option>
          </Select>
        </Campo>
      </div>
      <Campo label="Observação">
        <Textarea name="observacao" rows={2} defaultValue={dados?.observacao ?? ""} />
      </Campo>
      {dados && (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" name="ativo" defaultChecked={dados.ativo} />
          Consultor ativo (inativos não entram no cálculo do mês)
        </label>
      )}
      {estado?.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado?.ok && <Aviso tipo="ok">{estado.ok}</Aviso>}
      <Botao type="submit" disabled={enviando}>
        {enviando ? "Salvando…" : rotuloBotao}
      </Botao>
    </form>
  );
}
