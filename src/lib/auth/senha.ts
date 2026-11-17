import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";

export function gerarHash(senha: string) {
  return bcrypt.hash(senha, 10);
}

export function conferirSenha(senha: string, hash: string) {
  return bcrypt.compare(senha, hash);
}

/** Senha provisória legível (sem 0/O, 1/l/I), para o admin repassar ao usuário. */
export function gerarSenhaProvisoria(tamanho = 10) {
  const letras = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: tamanho }, () => letras[randomInt(letras.length)]).join("");
}
