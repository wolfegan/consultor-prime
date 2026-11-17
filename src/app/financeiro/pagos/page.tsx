import { EmConstrucao } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function Pagina() {
  await exigirPerfil("FINANCEIRO", "ADMIN");
  return (
    <EmConstrucao
      titulo="Pagos"
      itens={[
        "Pagamentos registrados, com comprovante",
      ]}
    />
  );
}
