import { Shell } from "@/components/shell";
import { exigirConsultor } from "@/lib/auth/dal";

export default async function LayoutConsultor({ children }: LayoutProps<"/consultor">) {
  const usuario = await exigirConsultor();
  return <Shell usuario={usuario}>{children}</Shell>;
}
