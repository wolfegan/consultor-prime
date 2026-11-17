import { redirect } from "next/navigation";
import { exigirUsuario, INICIO_DO_PERFIL } from "@/lib/auth/dal";

/** Página inicial: leva cada perfil para a sua área. */
export default async function Inicio() {
  const usuario = await exigirUsuario();
  redirect(INICIO_DO_PERFIL[usuario.perfil]);
}
