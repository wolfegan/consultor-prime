import { Shell } from "@/components/shell";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function LayoutFinanceiro({ children }: LayoutProps<"/financeiro">) {
  const usuario = await exigirPerfil("FINANCEIRO", "ADMIN");
  return <Shell usuario={usuario}>{children}</Shell>;
}
