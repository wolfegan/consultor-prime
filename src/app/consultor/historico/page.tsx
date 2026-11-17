import { EmConstrucao } from "@/components/ui";
import { exigirConsultor } from "@/lib/auth/dal";

export default async function Pagina() {
  await exigirConsultor();
  return (
    <EmConstrucao
      titulo="Histórico"
      itens={[
        "Meses anteriores: valores, notas e comprovantes de pagamento",
      ]}
    />
  );
}
