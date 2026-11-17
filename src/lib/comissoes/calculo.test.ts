import { describe, expect, it } from "vitest";
import { calcularPeriodo, normalizarNome, type DadosPeriodo } from "./calculo";

/**
 * Mesmos dados fictícios da planilha (abas IMPORTAR_SGA, LANCAMENTOS_MANUAIS,
 * INDICACOES_2 e DESPESAS). Os resultados esperados vêm da aba EXEMPLOS_DE_USO.
 * As "transferências de base" da planilha viram apelidos de SGA no recebedor.
 */
const dados: DadosPeriodo = {
  consultores: [
    { id: "ueliton", nome: "UELITON DE SOUZA CONCEICAO", nomesSga: [] },
    { id: "raquel", nome: "RAQUEL LOPES OLIVEIRA PAIXÃO", nomesSga: ["CARLOS ANDRE LOPES DE OLIVEIRA RIOS"] },
    { id: "clodoaldo", nome: "CLODOALDO DOS ANJOS SOUZA", nomesSga: [] },
    { id: "icaro", nome: "ICARO CUNHA DA SILVA", nomesSga: [] },
    { id: "arilma", nome: "ARILMA CARNEIRO DE ARAUJO", nomesSga: ["ARILMA CARNEIRO ARAUJO", "HELTONCLEI"] },
    { id: "jean", nome: "JEAN CARLOS DE LIMA SANTOS", nomesSga: ["ANTONIO AURELIO SERRA ROXO"] },
    { id: "adenilson", nome: "ADENILSON MENDES DE JESUS", nomesSga: [] },
    { id: "adilsonM", nome: "ADILSON MENDES DOS SANTOS", nomesSga: [] },
    { id: "adilsonN", nome: "ADILSON NASCIMENTO COSTA", nomesSga: [] },
  ],
  sga: [
    { nomeSga: "UELITON DE SOUZA CONCEICAO", faturamento: 18000, placas: 24 },
    { nomeSga: "RAQUEL LOPES OLIVEIRA PAIXAO", faturamento: 12000, placas: 17 },
    { nomeSga: "CLODOALDO DOS ANJOS SOUZA", faturamento: 10000, placas: 13 },
    { nomeSga: "ICARO CUNHA DA SILVA", faturamento: 8000, placas: 11 },
    { nomeSga: "ARILMA CARNEIRO ARAUJO", faturamento: 5000, placas: 8 },
    { nomeSga: "HELTONCLEI", faturamento: 4000, placas: 6 },
    { nomeSga: "CARLOS ANDRE LOPES DE OLIVEIRA RIOS", faturamento: 3000, placas: 5 },
    { nomeSga: "ANTONIO AURELIO SERRA ROXO", faturamento: 6000, placas: 8 },
    { nomeSga: "JEAN CARLOS DE LIMA SANTOS", faturamento: 9000, placas: 12 },
    { nomeSga: "ADENILSON MENDES DE JESUS", faturamento: 20000, placas: 20 },
    { nomeSga: "ADILSON MENDES DOS SANTOS", faturamento: 7000, placas: 6 },
    { nomeSga: "ADILSON NASCIMENTO COSTA", faturamento: 900, placas: 2 },
  ],
  lancamentos: [
    { consultorId: "ueliton", empresa: "TRIUNI", comissao: 240, placas: 3 },
    { consultorId: "raquel", empresa: "TRIUNI", comissao: 150, placas: 2 },
    { consultorId: "arilma", empresa: "AGV", comissao: 200, placas: 3 },
    { consultorId: "jean", empresa: "SAFE_CLUB", comissao: 360, placas: 2 },
    { consultorId: "adenilson", empresa: "TRIUNI", comissao: 400, placas: 5 },
    { consultorId: "adilsonM", empresa: "AGV", comissao: 160, placas: 2 },
    { consultorId: "adilsonN", empresa: "TRIUNI", comissao: 50, placas: 2 },
    { consultorId: "clodoaldo", empresa: "SAFE_CLUB", comissao: 120, placas: 1 },
  ],
  indicacoes: [
    { recebedorId: "ueliton", indicadoId: "raquel", percentual: 0.02 },
    { recebedorId: "ueliton", indicadoId: "clodoaldo", percentual: 0.02 },
    { recebedorId: "ueliton", indicadoId: "icaro", percentual: 0.02 },
  ],
  despesas: [
    { consultorId: "ueliton", valor: 120 },
    { consultorId: "arilma", valor: 80 },
    { consultorId: "jean", valor: 75 },
    { consultorId: "adenilson", valor: 50 },
  ],
};

const resultado = calcularPeriodo(dados);
const de = (id: string) => resultado.consultores.find((r) => r.consultorId === id)!;

describe("exemplos da planilha (aba EXEMPLOS_DE_USO)", () => {
  it("comissão própria 5%: Adenilson, R$ 20.000 de base => R$ 1.000", () => {
    expect(de("adenilson").comissaoPorEmpresa.COOPERCAR).toBe(1000);
  });

  it("indicações 2%: Ueliton recebe 2% sobre a base dos indicados", () => {
    // Raquel 15.000 (12.000 + 3.000 da base que assumiu) + Clodoaldo 10.000 + Ícaro 8.000.
    // Na planilha eram R$ 30.000: a base assumida pela Raquel ficava fora da indicação.
    expect(de("ueliton").baseIndicada).toBe(33000);
    expect(de("ueliton").comissaoIndicacoes).toBe(660);
  });

  it("base assumida de outro consultor entra pelo apelido de SGA", () => {
    expect(de("arilma").comissaoPropria).toBe(450); // 5% de 9.000
    expect(de("raquel").comissaoPropria).toBe(750); // 5% de 15.000
    expect(de("jean").comissaoPropria).toBe(750); // 5% de 15.000
    expect(de("arilma").placasPorEmpresa.COOPERCAR).toBe(14); // 8 + 6
    expect(de("arilma").producaoTotal).toBe(17);
  });

  it("bonificação: Adilson Mendes, comissão R$ 510 e 8 placas => bônus R$ 1.111", () => {
    expect(de("adilsonM").comissaoTotal).toBe(510);
    expect(de("adilsonM").bonificacao).toBe(1111);
    expect(de("adilsonM").valorNf).toBe(1621);
  });

  it("sem bonificação com 4 placas ou menos, ou comissão acima do piso", () => {
    expect(de("adilsonN").producaoTotal).toBe(4);
    expect(de("adilsonN").bonificacao).toBe(0);
    expect(de("adilsonN").valorNf).toBe(95);
    expect(de("ueliton").comissaoTotal).toBe(1800); // 900 + 660 + 240
    expect(de("ueliton").bonificacao).toBe(0);
  });

  it("débitos são descontados do valor da NF", () => {
    expect(de("ueliton").debitos).toBe(120);
    expect(de("ueliton").valorLiquido).toBe(1680);
    expect(de("adenilson").valorNf).toBe(1621);
    expect(de("adenilson").valorLiquido).toBe(1571);
  });

  it("todas as linhas do SGA foram identificadas", () => {
    expect(resultado.sgaNaoIdentificado).toEqual([]);
  });
});

describe("notas por CNPJ", () => {
  it("uma nota para Coopercar+Triuni e outra para Safe Club+AGV", () => {
    // Jean: Coopercar 750 + bônus 511 | Safe Club 360
    expect(de("jean").notas).toEqual([
      { emissor: "COOPERCAR_TRIUNI", valor: 1261 },
      { emissor: "SAFE_AGV", valor: 360 },
    ]);
  });

  it("não gera nota de CNPJ sem valor", () => {
    expect(de("ueliton").notas).toEqual([{ emissor: "COOPERCAR_TRIUNI", valor: 1800 }]);
  });

  it("a soma das notas é o valor a faturar", () => {
    for (const r of resultado.consultores) {
      expect(r.notas.reduce((s, n) => s + n.valor, 0)).toBeCloseTo(r.valorNf, 2);
    }
  });
});

describe("importação do SGA", () => {
  it("ignora acentos, caixa e espaços ao casar nomes", () => {
    expect(normalizarNome("  Raquel Lopes  Oliveira Paixão ")).toBe("RAQUEL LOPES OLIVEIRA PAIXAO");
  });

  it("devolve as linhas cujo nome não está no cadastro", () => {
    const r = calcularPeriodo({
      ...dados,
      sga: [...dados.sga, { nomeSga: "FULANO DESCONHECIDO", faturamento: 1000, placas: 1 }],
    });
    expect(r.sgaNaoIdentificado).toHaveLength(1);
    expect(r.totais).toEqual(resultado.totais);
  });

  it("recusa o mesmo nome SGA em dois consultores", () => {
    expect(() =>
      calcularPeriodo({
        ...dados,
        consultores: [...dados.consultores, { id: "dup", nome: "HELTONCLEI", nomesSga: [] }], // já é apelido da Arilma
      }),
    ).toThrow(/mais de um consultor/);
  });
});
