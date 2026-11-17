import { EmConstrucao } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function PaginaFinanceiro() {
  await exigirPerfil("FINANCEIRO", "ADMIN");
  return (
    <EmConstrucao
      titulo="A pagar"
      itens={[
        "Consultores com todas as notas do mês aprovadas",
        "Valor da nota, débitos e valor líquido a pagar de cada um, com o PIX",
        "Marcar como pago e anexar o comprovante",
      ]}
    />
  );
}
