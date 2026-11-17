/** Formatação para exibição (pt-BR). */

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function reais(valor: number | string | null | undefined) {
  return moeda.format(Number(valor ?? 0));
}

export function soDigitos(v: string) {
  return v.replace(/\D/g, "");
}

/** 11 dígitos → CPF, 14 → CNPJ; outros valores voltam como vieram. */
export function formatarDocumento(doc: string | null | undefined) {
  if (!doc) return "";
  const d = soDigitos(doc);
  if (d.length === 11) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (d.length === 14) return d.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return doc;
}

export function dataHora(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}
