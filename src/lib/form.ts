/** Estado devolvido pelas server actions de formulário (usado com useActionState). */
export type EstadoForm = { erro?: string; ok?: string; senhaProvisoria?: string } | undefined;

/** Lê um campo de texto do formulário; vazio vira null. */
export function texto(form: FormData, campo: string): string | null {
  const v = form.get(campo);
  if (typeof v !== "string") return null;
  const limpo = v.trim();
  return limpo === "" ? null : limpo;
}
