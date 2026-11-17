import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

/** Cria a conexão. Usado pelo app (src/db/index.ts) e pelos scripts de linha de comando. */
export function criarConexao(url: string | undefined) {
  // Não falha na importação (o build importa os módulos); a primeira consulta é que falha.
  if (!url) console.error("DATABASE_URL não configurada (veja .env.example).");
  // Hospedagem compartilhada tem limite de conexões: poucas e reaproveitadas.
  const pool = mysql.createPool({
    uri: url ?? "mysql://nao-configurado@127.0.0.1:1/x",
    connectionLimit: 5,
    timezone: "Z",
  });
  return { pool, db: drizzle(pool, { schema, mode: "default" }) };
}

export type Db = ReturnType<typeof criarConexao>["db"];
