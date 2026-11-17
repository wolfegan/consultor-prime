import { EmConstrucao } from "@/components/ui";
import { exigirConsultor } from "@/lib/auth/dal";

export default async function PaginaConsultor() {
  await exigirConsultor();
  return (
    <EmConstrucao
      titulo="Mês atual"
      itens={[
        "Valor previsto do mês em aberto, com o detalhamento por empresa",
        "Notas a emitir: uma para cada CNPJ (Coopercar + Triuni e Safe Club + AGV)",
        "Envio do PDF de cada nota e situação da aprovação",
        "Débitos do mês e valor líquido a receber",
      ]}
    />
  );
}
