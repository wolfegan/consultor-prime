/**
 * Importa o cadastro de consultores e as indicações da Planilha Mestre (Excel).
 *
 *   npm run importar-planilha -- caminho/da/planilha.xlsx            (só mostra o que faria)
 *   npm run importar-planilha -- caminho/da/planilha.xlsx --gravar   (grava no banco)
 *
 * Abas lidas: CADASTRO (a partir da linha 5) e INDICACOES_2.
 * Pode ser rodado mais de uma vez: quem já existe (pelo nome no SGA) não é duplicado.
 */
import { config } from "dotenv";
import * as XLSX from "xlsx";
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { criarConexao } from "../src/db/conexao";
import { consultores, consultorNomesSga, indicacoes } from "../src/db/schema";
import { normalizarNome } from "../src/lib/comissoes/calculo";

config({ path: ".env.local" });

const { values, positionals } = parseArgs({
  options: { gravar: { type: "boolean", default: false } },
  allowPositionals: true,
});

/** Linhas de uma aba a partir da linha 5 (cabeçalho na 4), como texto. */
function linhasDaAba(wb: XLSX.WorkBook, aba: string): { linha: number; c: string[] }[] {
  const ws = wb.Sheets[aba];
  if (!ws) return [];
  const linhas = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    range: 4,
    defval: "",
    raw: false,
    blankrows: true,
  });
  return linhas.map((r, i) => ({ linha: i + 5, c: r.map((v) => String(v ?? "").trim()) }));
}

/** "2%", "0.02" ou "2" → 0.02. Vazio → 2%. */
function percentual(v: string | undefined): number {
  const n = Number((v ?? "").replace("%", "").replace(",", "."));
  if (!n) return 0.02;
  return v?.includes("%") || n >= 1 ? n / 100 : n;
}

const VEICULOS = new Set(["MOTO", "CARRO", "S/V"]);
const VINCULOS = new Set(["PJ", "CLT", "ADM"]);
const CPF = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
const CNPJ = /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/;
const TELEFONE = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

type Linha = {
  linha: number;
  nome: string;
  nomeSga: string;
  tipoVeiculo: string;
  vinculo: string;
  pix: string;
  ativo: boolean;
};

async function main() {
  const arquivo = positionals[0];
  if (!arquivo) {
    console.error("Uso: npm run importar-planilha -- caminho/da/planilha.xlsx [--gravar]");
    process.exit(1);
  }

  const wb = XLSX.read(readFileSync(arquivo));
  if (!wb.Sheets["CADASTRO"]) throw new Error('Aba "CADASTRO" não encontrada.');

  const linhas: Linha[] = linhasDaAba(wb, "CADASTRO")
    .filter((r) => r.c[0])
    .map(({ linha, c }) => ({
      linha,
      nome: c[0].toUpperCase(),
      nomeSga: (c[1] || c[0]).toUpperCase(),
      tipoVeiculo: (c[2] ?? "").toUpperCase(),
      vinculo: (c[3] ?? "").toUpperCase(),
      pix: c[4] ?? "",
      ativo: (c[6] ?? "").toUpperCase() !== "NÃO",
    }));

  const { db, pool } = criarConexao(process.env.DATABASE_URL);
  try {
    // nome normalizado do SGA -> id do consultor (o que já está no banco + o que será criado)
    // Sem banco configurado, a simulação parte de um cadastro vazio.
    const semBanco = !values.gravar && !process.env.DATABASE_URL;
    const existentes = semBanco ? [] : await db.select().from(consultorNomesSga);
    const porNome = new Map(existentes.map((n) => [n.nomeNormalizado, n.consultorId]));
    let proximoIdSimulado = -1;

    const relatorio = { criados: [] as string[], mesclados: [] as string[], jaExistiam: [] as string[] };
    const nomesCriados: { id: number; nome: string; linha: number }[] = [];

    for (const l of linhas) {
      const chaves = [...new Set([normalizarNome(l.nome), normalizarNome(l.nomeSga)])];
      const idExistente = chaves.map((k) => porNome.get(k)).find((id) => id !== undefined);

      if (idExistente !== undefined) {
        const novos = chaves.filter((k) => !porNome.has(k));
        if (novos.length === 0) {
          relatorio.jaExistiam.push(`linha ${l.linha}: ${l.nome}`);
          continue;
        }
        // Linha repetida com outra grafia: vira um nome a mais do mesmo consultor.
        for (const k of novos) {
          const nome = k === normalizarNome(l.nome) ? l.nome : l.nomeSga;
          if (values.gravar) {
            await db
              .insert(consultorNomesSga)
              .values({ consultorId: idExistente, nome, nomeNormalizado: k });
          }
          porNome.set(k, idExistente);
          relatorio.mesclados.push(`linha ${l.linha}: "${nome}" virou nome SGA de um consultor já cadastrado`);
        }
        continue;
      }

      const pix = l.pix === "*" ? "" : l.pix;
      const dados = {
        nome: l.nome,
        pix: pix || null,
        cpfCnpj: CPF.test(pix) || CNPJ.test(pix) ? pix.replace(/\D/g, "") : null,
        telefone: TELEFONE.test(pix) ? pix : null,
        tipoVeiculo: VEICULOS.has(l.tipoVeiculo) ? (l.tipoVeiculo as "MOTO") : null,
        vinculo: VINCULOS.has(l.vinculo) ? (l.vinculo as "PJ") : null,
        ativo: l.ativo,
      };

      let id = proximoIdSimulado--;
      if (values.gravar) {
        id = await db.transaction(async (tx) => {
          const [r] = await tx.insert(consultores).values(dados).$returningId();
          await tx.insert(consultorNomesSga).values(
            chaves.map((k) => ({
              consultorId: r.id,
              nome: k === normalizarNome(l.nome) ? l.nome : l.nomeSga,
              nomeNormalizado: k,
            })),
          );
          return r.id;
        });
      }
      for (const k of chaves) porNome.set(k, id);
      nomesCriados.push({ id, nome: l.nome, linha: l.linha });
      relatorio.criados.push(`linha ${l.linha}: ${l.nome}`);
    }

    // Indicações
    const indRelatorio: string[] = [];
    {
      const linhasInd = linhasDaAba(wb, "INDICACOES_2")
        .filter((r) => r.c[0] && r.c[1])
        .map(({ linha, c }) => ({
          linha,
          recebedor: c[0],
          indicado: c[1],
          pct: percentual(c[2]),
        }));
      for (const i of linhasInd) {
        const recebedorId = porNome.get(normalizarNome(i.recebedor));
        const indicadoId = porNome.get(normalizarNome(i.indicado));
        if (recebedorId === undefined || indicadoId === undefined) {
          indRelatorio.push(`linha ${i.linha}: NÃO ENCONTRADO ${i.recebedor} -> ${i.indicado}`);
          continue;
        }
        if (values.gravar) {
          await db
            .insert(indicacoes)
            .values({ recebedorId, indicadoId, percentual: i.pct.toFixed(4) })
            .onDuplicateKeyUpdate({ set: { recebedorId } });
        }
        indRelatorio.push(`linha ${i.linha}: ${i.recebedor} indicou ${i.indicado} (${+(i.pct * 100).toFixed(2)}%)`);
      }
    }

    // Possíveis duplicados: mesmo primeiro nome e um nome contido no outro.
    const suspeitos: string[] = [];
    for (const a of nomesCriados) {
      for (const b of nomesCriados) {
        if (a.linha >= b.linha) continue;
        const [na, nb] = [normalizarNome(a.nome), normalizarNome(b.nome)];
        const pa = na.split(" ");
        const pb = nb.split(" ");
        const comuns = pa.filter((p) => p.length > 2 && pb.includes(p)).length;
        if (pa[0] === pb[0] && (na.startsWith(nb) || nb.startsWith(na) || comuns >= 3)) {
          suspeitos.push(`linha ${a.linha} "${a.nome}"  x  linha ${b.linha} "${b.nome}"`);
        }
      }
    }

    const secao = (titulo: string, itens: string[]) => {
      console.log(`\n${titulo} (${itens.length})`);
      for (const i of itens) console.log(`  - ${i}`);
    };
    console.log(values.gravar ? "\n== IMPORTAÇÃO GRAVADA ==" : "\n== SIMULAÇÃO (nada foi gravado; use --gravar) ==");
    secao("Consultores novos", relatorio.criados);
    secao("Linhas repetidas mescladas", relatorio.mesclados);
    secao("Ignoradas: linha repetida na planilha ou já cadastrada", relatorio.jaExistiam);
    secao("Indicações", indRelatorio);
    secao("VERIFICAR: possíveis duplicados (mesclar à mão no sistema)", suspeitos);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
