import "server-only";
import { criarConexao } from "./conexao";
import * as schema from "./schema";

const global_ = globalThis as unknown as { conexao?: ReturnType<typeof criarConexao> };

// Em desenvolvimento o Next recarrega módulos; reaproveita o pool entre recargas.
const conexao = global_.conexao ?? criarConexao(process.env.DATABASE_URL);
if (process.env.NODE_ENV !== "production") global_.conexao = conexao;

export const db = conexao.db;
export { schema };
