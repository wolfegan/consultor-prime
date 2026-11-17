/**
 * Motor de cálculo de comissões — reproduz as regras da "Planilha Mestre".
 *
 * Regras (abas COMISSOES, BONIFICACAO e ENVIO_FINANCEIRO):
 *  - Coopercar: 5% sobre o faturamento da base do consultor no SGA.
 *  - Indicação (mononível): % sobre o faturamento Coopercar próprio de cada indicado direto.
 *  - Triuni / AGV / Safe Club: comissão e placas lançadas manualmente.
 *  - Bonificação: produção total > 4 placas e comissão total < piso => completa até o piso.
 *  - Valor a faturar = comissões + bonificação. Líquido = valor a faturar - débitos.
 *  - Notas fiscais: uma por CNPJ emissor (Coopercar+Triuni e Safe Club+AGV).
 *
 * Não existe "transferência de base": se um consultor assume a base de outro, basta
 * cadastrar o nome antigo do SGA em `nomesSga` de quem assumiu.
 *
 * Funções puras, sem acesso a banco: recebem os dados do período e devolvem o resultado.
 */

export type Empresa = "COOPERCAR" | "TRIUNI" | "AGV" | "SAFE_CLUB";

export const EMPRESAS_MANUAIS = ["TRIUNI", "AGV", "SAFE_CLUB"] as const;
export type EmpresaManual = (typeof EMPRESAS_MANUAIS)[number];

/** Cada CNPJ para o qual o consultor emite nota, e as empresas que ele cobre. */
export const EMISSORES = {
  COOPERCAR_TRIUNI: ["COOPERCAR", "TRIUNI"],
  SAFE_AGV: ["SAFE_CLUB", "AGV"],
} as const satisfies Record<string, readonly Empresa[]>;
export type Emissor = keyof typeof EMISSORES;

export interface Consultor {
  id: string;
  nome: string;
  /** Nomes pelos quais o consultor aparece no relatório do SGA. */
  nomesSga: string[];
}

export interface LinhaSga {
  nomeSga: string;
  faturamento: number;
  placas: number;
}

export interface LancamentoManual {
  consultorId: string;
  empresa: EmpresaManual;
  comissao: number;
  placas: number;
  faturamento?: number;
}

export interface Indicacao {
  recebedorId: string;
  indicadoId: string;
  /** Ex.: 0.02 para 2%. */
  percentual: number;
}

export interface Despesa {
  consultorId: string;
  valor: number;
}

export interface Parametros {
  percentualComissao: number;
  pisoBonificacao: number;
  /** A bonificação exige produção ESTRITAMENTE maior que este valor. */
  placasMinimas: number;
  /** CNPJ em cuja nota a bonificação é somada. */
  emissorBonificacao: Emissor;
}

export const PARAMETROS_PADRAO: Parametros = {
  percentualComissao: 0.05,
  pisoBonificacao: 1621,
  placasMinimas: 4,
  emissorBonificacao: "COOPERCAR_TRIUNI",
};

export interface DadosPeriodo {
  consultores: Consultor[];
  sga: LinhaSga[];
  lancamentos: LancamentoManual[];
  indicacoes: Indicacao[];
  despesas: Despesa[];
  parametros?: Partial<Parametros>;
}

export interface ResultadoConsultor {
  consultorId: string;
  nome: string;
  /** Faturamento Coopercar do consultor no SGA. */
  faturamentoBase: number;
  comissaoPropria: number;
  /** Soma do faturamento Coopercar dos indicados diretos. */
  baseIndicada: number;
  comissaoIndicacoes: number;
  comissaoPorEmpresa: Record<Empresa, number>;
  placasPorEmpresa: Record<Empresa, number>;
  comissaoTotal: number;
  producaoTotal: number;
  elegivelBonificacao: boolean;
  bonificacao: number;
  /** Total a faturar no mês (soma das notas). */
  valorNf: number;
  /** Notas a emitir, uma por CNPJ com valor maior que zero. */
  notas: { emissor: Emissor; valor: number }[];
  debitos: number;
  valorLiquido: number;
}

export interface ResultadoPeriodo {
  consultores: ResultadoConsultor[];
  /** Linhas do SGA cujo nome não bateu com nenhum consultor cadastrado. */
  sgaNaoIdentificado: LinhaSga[];
  totais: { valorNf: number; debitos: number; valorLiquido: number };
}

/** Compara nomes ignorando acentos, caixa e espaços extras. */
export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/\s+/g, " ")
    .trim();
}

const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export function calcularPeriodo(dados: DadosPeriodo): ResultadoPeriodo {
  const p: Parametros = { ...PARAMETROS_PADRAO, ...dados.parametros };

  // nome no SGA -> consultor
  const porNomeSga = new Map<string, string>();
  for (const c of dados.consultores) {
    for (const nome of [c.nome, ...c.nomesSga]) {
      const chave = normalizarNome(nome);
      const existente = porNomeSga.get(chave);
      if (existente && existente !== c.id) {
        throw new Error(`Nome SGA "${nome}" está associado a mais de um consultor.`);
      }
      porNomeSga.set(chave, c.id);
    }
  }

  // Faturamento e placas Coopercar próprios (direto do SGA)
  const fatProprio = new Map<string, number>();
  const placasProprias = new Map<string, number>();
  const sgaNaoIdentificado: LinhaSga[] = [];
  for (const linha of dados.sga) {
    const id = porNomeSga.get(normalizarNome(linha.nomeSga));
    if (!id) {
      sgaNaoIdentificado.push(linha);
      continue;
    }
    fatProprio.set(id, (fatProprio.get(id) ?? 0) + linha.faturamento);
    placasProprias.set(id, (placasProprias.get(id) ?? 0) + linha.placas);
  }

  const consultores = dados.consultores.map((c): ResultadoConsultor => {
    const faturamentoBase = fatProprio.get(c.id) ?? 0;
    const placasCoopercar = placasProprias.get(c.id) ?? 0;

    const comissaoPropria = centavos(faturamentoBase * p.percentualComissao);

    let baseIndicada = 0;
    let comissaoIndicacoes = 0;
    for (const i of dados.indicacoes) {
      if (i.recebedorId !== c.id) continue;
      const fat = fatProprio.get(i.indicadoId) ?? 0;
      baseIndicada += fat;
      comissaoIndicacoes += fat * i.percentual;
    }
    comissaoIndicacoes = centavos(comissaoIndicacoes);

    const comissaoPorEmpresa: Record<Empresa, number> = {
      COOPERCAR: centavos(comissaoPropria + comissaoIndicacoes),
      TRIUNI: 0,
      AGV: 0,
      SAFE_CLUB: 0,
    };
    const placasPorEmpresa: Record<Empresa, number> = {
      COOPERCAR: placasCoopercar,
      TRIUNI: 0,
      AGV: 0,
      SAFE_CLUB: 0,
    };
    for (const l of dados.lancamentos) {
      if (l.consultorId !== c.id) continue;
      comissaoPorEmpresa[l.empresa] = centavos(comissaoPorEmpresa[l.empresa] + l.comissao);
      placasPorEmpresa[l.empresa] += l.placas;
    }

    const comissaoTotal = centavos(
      Object.values(comissaoPorEmpresa).reduce((s, v) => s + v, 0),
    );
    const producaoTotal = Object.values(placasPorEmpresa).reduce((s, v) => s + v, 0);

    const elegivelBonificacao =
      producaoTotal > p.placasMinimas && comissaoTotal < p.pisoBonificacao;
    const bonificacao = elegivelBonificacao ? centavos(p.pisoBonificacao - comissaoTotal) : 0;

    const valorNf = centavos(comissaoTotal + bonificacao);
    const notas = (Object.keys(EMISSORES) as Emissor[])
      .map((emissor) => ({
        emissor,
        valor: centavos(
          EMISSORES[emissor].reduce((s, e) => s + comissaoPorEmpresa[e], 0) +
            (emissor === p.emissorBonificacao ? bonificacao : 0),
        ),
      }))
      .filter((n) => n.valor > 0);
    const debitos = centavos(
      dados.despesas.filter((d) => d.consultorId === c.id).reduce((s, d) => s + d.valor, 0),
    );

    return {
      consultorId: c.id,
      nome: c.nome,
      faturamentoBase,
      comissaoPropria,
      baseIndicada,
      comissaoIndicacoes,
      comissaoPorEmpresa,
      placasPorEmpresa,
      comissaoTotal,
      producaoTotal,
      elegivelBonificacao,
      bonificacao,
      valorNf,
      notas,
      debitos,
      valorLiquido: centavos(valorNf - debitos),
    };
  });

  return {
    consultores,
    sgaNaoIdentificado,
    totais: {
      valorNf: centavos(consultores.reduce((s, r) => s + r.valorNf, 0)),
      debitos: centavos(consultores.reduce((s, r) => s + r.debitos, 0)),
      valorLiquido: centavos(consultores.reduce((s, r) => s + r.valorLiquido, 0)),
    },
  };
}
