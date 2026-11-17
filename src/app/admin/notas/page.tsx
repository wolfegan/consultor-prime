import { EmConstrucao } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function Pagina() {
  await exigirPerfil("ADMIN");
  return (
    <EmConstrucao
      titulo="Notas fiscais"
      itens={[
        "Notas enviadas pelos consultores, por mês e CNPJ",
        "Aprovar ou reprovar com motivo",
      ]}
    />
  );
}
