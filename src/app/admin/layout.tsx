import { Shell } from "@/components/shell";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  const usuario = await exigirPerfil("ADMIN");
  return <Shell usuario={usuario}>{children}</Shell>;
}
