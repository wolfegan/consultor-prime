import { EmConstrucao } from "@/components/ui";
import { exigirPerfil } from "@/lib/auth/dal";

export default async function Pagina() {
  await exigirPerfil("ADMIN");
  return (
    <EmConstrucao
      titulo="Relatórios"
      itens={[
        "Resumo do mês por consultor e por empresa",
        "Exportação para Excel",
      ]}
    />
  );
}
