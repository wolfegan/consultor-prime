import { EmConstrucao } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function Pagina() {
  await exigirPerfil("ADMIN");
  return (
    <EmConstrucao
      titulo="Mês e lançamentos"
      itens={[
        "Importação do relatório do SGA (boletos baixados por voluntário)",
        "Lançamentos de Triuni, AGV e Safe Club",
        "Despesas (débitos) dos consultores",
        "Prévia do cálculo e fechamento do mês",
      ]}
    />
  );
}
