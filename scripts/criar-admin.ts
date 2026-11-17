/**
 * Cria o primeiro usuário administrador.
 *
 *   npm run criar-admin -- --email voce@empresa.com.br --nome "Seu Nome"
 *
 * Mostra uma senha provisória, que deve ser trocada no primeiro acesso.
 */
import { config } from "dotenv";
import { parseArgs } from "node:util";
import { criarConexao } from "../src/db/conexao";
import { usuarios } from "../src/db/schema";
import { gerarHash, gerarSenhaProvisoria } from "../src/lib/auth/senha";

config({ path: ".env.local" });

const { values } = parseArgs({
  options: { email: { type: "string" }, nome: { type: "string" } },
});

async function main() {
  const email = values.email?.trim().toLowerCase();
  const nome = values.nome?.trim();
  if (!email || !nome) {
    console.error('Uso: npm run criar-admin -- --email voce@empresa.com.br --nome "Seu Nome"');
    process.exit(1);
  }

  const { db, pool } = criarConexao(process.env.DATABASE_URL);
  const senha = gerarSenhaProvisoria();
  try {
    await db.insert(usuarios).values({
      nome,
      email,
      perfil: "ADMIN",
      senhaHash: await gerarHash(senha),
      trocarSenha: true,
    });
    console.log(`\nAdministrador criado: ${email}`);
    console.log(`Senha provisória: ${senha}`);
    console.log("Troque a senha no primeiro acesso.\n");
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
