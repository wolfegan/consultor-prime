import { relations } from "drizzle-orm";
import {
  boolean,
  char,
  date,
  datetime,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  index,
  varchar,
  bigint,
} from "drizzle-orm/mysql-core";

const id = () => bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey();
const ref = (nome: string) => bigint(nome, { mode: "number", unsigned: true });
const dinheiro = (nome: string) => decimal(nome, { precision: 12, scale: 2 });
const criadoEm = () => timestamp("criado_em").notNull().defaultNow();

export const PERFIS = ["ADMIN", "FINANCEIRO", "CONSULTOR"] as const;
export type Perfil = (typeof PERFIS)[number];

export const EMPRESAS = ["COOPERCAR", "TRIUNI", "AGV", "SAFE_CLUB"] as const;
export const EMPRESAS_MANUAIS = ["TRIUNI", "AGV", "SAFE_CLUB"] as const;
export const EMISSORES = ["COOPERCAR_TRIUNI", "SAFE_AGV"] as const;

export const VINCULOS = ["PJ", "CLT", "ADM"] as const;
export const TIPOS_VEICULO = ["MOTO", "CARRO", "S/V"] as const;

// ---------------------------------------------------------------------------
// Consultores
// ---------------------------------------------------------------------------

export const consultores = mysqlTable("consultores", {
  id: id(),
  nome: varchar("nome", { length: 160 }).notNull(),
  cpfCnpj: varchar("cpf_cnpj", { length: 20 }),
  email: varchar("email", { length: 160 }),
  telefone: varchar("telefone", { length: 30 }),
  pix: varchar("pix", { length: 160 }),
  tipoVeiculo: mysqlEnum("tipo_veiculo", TIPOS_VEICULO),
  vinculo: mysqlEnum("vinculo", VINCULOS),
  ativo: boolean("ativo").notNull().default(true),
  observacao: text("observacao"),
  criadoEm: criadoEm(),
});

/** Nomes pelos quais o consultor aparece como "voluntário" no relatório do SGA. */
export const consultorNomesSga = mysqlTable(
  "consultor_nomes_sga",
  {
    id: id(),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id, { onDelete: "cascade" }),
    nome: varchar("nome", { length: 160 }).notNull(),
    /** Sem acento, maiúsculo, espaços simples — usado para casar com o SGA. */
    nomeNormalizado: varchar("nome_normalizado", { length: 160 }).notNull(),
  },
  (t) => [uniqueIndex("nome_sga_unico").on(t.nomeNormalizado)],
);

/** Indicação mononível: cada consultor tem no máximo um indicador. */
export const indicacoes = mysqlTable(
  "indicacoes",
  {
    id: id(),
    recebedorId: ref("recebedor_id")
      .notNull()
      .references(() => consultores.id),
    indicadoId: ref("indicado_id")
      .notNull()
      .references(() => consultores.id, { onDelete: "cascade" }),
    /** Ex.: 0.0200 para 2%. */
    percentual: decimal("percentual", { precision: 6, scale: 4 }).notNull().default("0.0200"),
    observacao: varchar("observacao", { length: 255 }),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex("indicado_unico").on(t.indicadoId), index("recebedor").on(t.recebedorId)],
);

// ---------------------------------------------------------------------------
// Usuários e sessões
// ---------------------------------------------------------------------------

export const usuarios = mysqlTable(
  "usuarios",
  {
    id: id(),
    nome: varchar("nome", { length: 160 }).notNull(),
    email: varchar("email", { length: 160 }).notNull(),
    senhaHash: varchar("senha_hash", { length: 100 }).notNull(),
    perfil: mysqlEnum("perfil", PERFIS).notNull(),
    /** Preenchido apenas para o perfil CONSULTOR. */
    consultorId: ref("consultor_id").references(() => consultores.id),
    ativo: boolean("ativo").notNull().default(true),
    /** Obriga a troca de senha no próximo acesso (senha provisória). */
    trocarSenha: boolean("trocar_senha").notNull().default(true),
    ultimoAcesso: datetime("ultimo_acesso"),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex("email_unico").on(t.email), uniqueIndex("consultor_unico").on(t.consultorId)],
);

export const sessoes = mysqlTable(
  "sessoes",
  {
    /** SHA-256 do token guardado no cookie (o token em si não fica no banco). */
    id: char("id", { length: 64 }).primaryKey(),
    usuarioId: ref("usuario_id")
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    expiraEm: datetime("expira_em").notNull(),
    criadoEm: criadoEm(),
  },
  (t) => [index("sessao_usuario").on(t.usuarioId)],
);

// ---------------------------------------------------------------------------
// Período mensal e lançamentos
// ---------------------------------------------------------------------------

export const periodos = mysqlTable(
  "periodos",
  {
    id: id(),
    /** "2026-11" */
    mes: char("mes", { length: 7 }).notNull(),
    status: mysqlEnum("status", ["ABERTO", "FECHADO"]).notNull().default("ABERTO"),
    fechadoEm: datetime("fechado_em"),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex("mes_unico").on(t.mes)],
);

/** Linhas importadas do relatório do SGA (Coopercar), já somadas por voluntário. */
export const sgaLinhas = mysqlTable(
  "sga_linhas",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    nomeSga: varchar("nome_sga", { length: 160 }).notNull(),
    faturamento: dinheiro("faturamento").notNull(),
    placas: int("placas").notNull().default(0),
  },
  (t) => [index("sga_periodo").on(t.periodoId)],
);

/** Comissões de Triuni, AGV e Safe Club lançadas manualmente. */
export const lancamentos = mysqlTable(
  "lancamentos",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id),
    empresa: mysqlEnum("empresa", EMPRESAS_MANUAIS).notNull(),
    faturamento: dinheiro("faturamento"),
    comissao: dinheiro("comissao").notNull(),
    placas: int("placas").notNull().default(0),
  },
  (t) => [index("lanc_periodo").on(t.periodoId)],
);

/** Débitos do consultor, acertados depois da nota. */
export const despesas = mysqlTable(
  "despesas",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id),
    descricao: varchar("descricao", { length: 255 }).notNull(),
    data: date("data", { mode: "string" }),
    valor: dinheiro("valor").notNull(),
    observacao: varchar("observacao", { length: 255 }),
  },
  (t) => [index("desp_periodo").on(t.periodoId)],
);

// ---------------------------------------------------------------------------
// Fechamento, notas fiscais e pagamentos
// ---------------------------------------------------------------------------

/** Resultado do cálculo congelado no fechamento do mês. */
export const apuracoes = mysqlTable(
  "apuracoes",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id),
    comissaoTotal: dinheiro("comissao_total").notNull(),
    bonificacao: dinheiro("bonificacao").notNull(),
    valorNf: dinheiro("valor_nf").notNull(),
    debitos: dinheiro("debitos").notNull(),
    valorLiquido: dinheiro("valor_liquido").notNull(),
    producaoTotal: int("producao_total").notNull(),
    /** Detalhamento completo (comissão por empresa, placas, indicações). */
    detalhe: text("detalhe").notNull(),
  },
  (t) => [uniqueIndex("apuracao_unica").on(t.periodoId, t.consultorId)],
);

export const STATUS_NOTA = ["PENDENTE", "ENVIADA", "APROVADA", "REPROVADA"] as const;

/** Uma nota por consultor, por mês e por CNPJ emissor. */
export const notasFiscais = mysqlTable(
  "notas_fiscais",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id),
    emissor: mysqlEnum("emissor", EMISSORES).notNull(),
    valor: dinheiro("valor").notNull(),
    status: mysqlEnum("status", STATUS_NOTA).notNull().default("PENDENTE"),
    numero: varchar("numero", { length: 40 }),
    arquivo: varchar("arquivo", { length: 255 }),
    enviadaEm: datetime("enviada_em"),
    motivoReprovacao: varchar("motivo_reprovacao", { length: 500 }),
    avaliadaPor: ref("avaliada_por").references(() => usuarios.id),
    avaliadaEm: datetime("avaliada_em"),
  },
  (t) => [uniqueIndex("nota_unica").on(t.periodoId, t.consultorId, t.emissor)],
);

/** Pagamento do valor líquido, registrado pelo financeiro. */
export const pagamentos = mysqlTable(
  "pagamentos",
  {
    id: id(),
    periodoId: ref("periodo_id")
      .notNull()
      .references(() => periodos.id, { onDelete: "cascade" }),
    consultorId: ref("consultor_id")
      .notNull()
      .references(() => consultores.id),
    valor: dinheiro("valor").notNull(),
    pagoEm: date("pago_em", { mode: "string" }).notNull(),
    comprovante: varchar("comprovante", { length: 255 }),
    registradoPor: ref("registrado_por")
      .notNull()
      .references(() => usuarios.id),
    criadoEm: criadoEm(),
  },
  (t) => [uniqueIndex("pagamento_unico").on(t.periodoId, t.consultorId)],
);

// ---------------------------------------------------------------------------
// Relações (para consultas com `with`)
// ---------------------------------------------------------------------------

export const consultoresRelations = relations(consultores, ({ many }) => ({
  nomesSga: many(consultorNomesSga),
}));

export const consultorNomesSgaRelations = relations(consultorNomesSga, ({ one }) => ({
  consultor: one(consultores, {
    fields: [consultorNomesSga.consultorId],
    references: [consultores.id],
  }),
}));
