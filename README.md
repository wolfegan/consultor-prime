# Consultor Prime

Sistema web para controle e pagamento de comissões de consultores. Substitui a "Planilha Mestre de Comissões" (Excel) usada hoje para consolidar as comissões das quatro empresas — **Coopercar, Triuni, AGV e Safe Club** —, calcular bonificação, registrar débitos e apurar o líquido a pagar.

Uso interno da empresa, para cerca de 100 consultores.

## Status

| Etapa | Situação |
| --- | --- |
| Análise da planilha e extração das regras | Concluída |
| Motor de cálculo de comissões (com testes) | Concluído |
| Banco de dados (modelo e migração SQL) | Concluído, ainda não aplicado num MySQL |
| Login e perfis de acesso | Concluído, aguardando teste com banco |
| Cadastro de consultores, nomes no SGA, indicações e acessos | Concluído, aguardando teste com banco |
| Usuários internos (admin e financeiro) | Concluído, aguardando teste com banco |
| Importação do cadastro da planilha | Concluída (simulação testada) |
| Importação do SGA e lançamentos manuais | Pendente |
| Notas fiscais (envio, aprovação, pagamento) | Pendente |
| Relatórios | Pendente |
| Publicação na Hostinger | Pendente |

## Perfis de acesso

| Perfil | O que faz |
| --- | --- |
| **Admin** | Acesso geral: cadastros, importação do SGA, lançamentos, despesas, fechamento do mês, aprovação ou reprovação (com motivo) das notas fiscais, relatórios. |
| **Financeiro** | Vê as notas fiscais aprovadas e quanto pagar a cada consultor, marca o pagamento como pago e anexa o comprovante. |
| **Consultor** | Vê quais notas precisa emitir e o valor de cada uma, envia o PDF da nota de cada CNPJ, acompanha o valor previsto do mês em aberto, consulta os meses anteriores e os comprovantes. |

O pagamento em si é feito fora do sistema; o financeiro apenas registra que foi pago.

## Fluxo mensal

1. Admin importa o relatório do SGA (Excel) com faturamento e placas da Coopercar.
2. Admin lança comissões e placas de Triuni, AGV e Safe Club, e as despesas dos consultores.
3. O sistema calcula comissões, indicações, bonificação e valor líquido.
4. Admin fecha o mês; cada consultor passa a ver o valor das notas a emitir.
5. Consultor envia o PDF da nota fiscal.
6. Admin aprova ou reprova com motivo (reprovada volta para o consultor reenviar).
7. Financeiro paga fora do sistema, marca como pago e anexa o comprovante.

## CNPJs emissores das notas

| Empresas | Razão social | CNPJ |
| --- | --- | --- |
| Coopercar + Triuni | Associação de Proteção Mutualista Popcar da Bahia | 09.267.364/0001-07 |
| Safe Club + AGV | Silva Corretora de Seguros Ltda | 20.468.962/0001-87 |

## Regras de cálculo

Extraídas da planilha e implementadas em `src/lib/comissoes/calculo.ts`.

| Regra | Como funciona |
| --- | --- |
| Comissão Coopercar | 5% sobre o valor dos boletos pagos (baixados) dos veículos em que o consultor consta como **"voluntário"** no SGA. O total desses boletos no mês é o "faturamento da base". |
| Indicação (mononível) | 2% sobre o faturamento Coopercar próprio de cada indicado direto. Só um nível. |
| Base assumida de outro consultor | Não há tela de "transferência de base". Quem assume a base recebe o nome antigo do SGA como apelido no seu cadastro; faturamento e placas passam a contar como dele. |
| Triuni / AGV / Safe Club | Comissão e quantidade de placas lançadas manualmente, por consultor e empresa. |
| Bonificação | Se a produção total for **maior que 4 placas** e a comissão total for **menor que R$ 1.621,00**, a bonificação completa a diferença até R$ 1.621,00. |
| Valor a faturar | Comissões das quatro empresas + bonificação. |
| Notas fiscais | Uma por CNPJ: **Coopercar + Triuni** e **Safe Club + AGV**. Só há nota para o CNPJ com valor no mês. A bonificação entra na nota Coopercar + Triuni (parâmetro). |
| Débitos | Não alteram a nota: o consultor emite a nota pelo valor cheio. As despesas são acertadas depois, e o resultado é o valor líquido (valor a faturar menos débitos). |

Os percentuais (5%), o piso (R$ 1.621,00) e o mínimo de placas (4) são parâmetros, não valores fixos no código.

O casamento de nomes com o relatório do SGA ignora acentos, maiúsculas e espaços extras. Cada consultor pode ter vários "nomes no SGA". Linhas do relatório que não batem com nenhum consultor são devolvidas para o admin resolver, em vez de serem descartadas em silêncio.

## Decisões em aberto

- **Bonificação na nota:** hoje entra na nota Coopercar + Triuni; confirmar.
- **Acerto dos débitos:** se o financeiro paga já o valor líquido, ou paga a nota cheia e o consultor devolve o débito depois.
- **Formato do relatório do SGA:** se vem uma linha por boleto ou já somado por voluntário, e quais são as colunas.
- **Armazenamento dos PDFs:** disco da Hostinger ou serviço externo (ver Hospedagem).

## Tecnologia

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS
- Vitest para testes
- MySQL (da própria Hostinger) com [Drizzle ORM](https://orm.drizzle.team) — JavaScript puro, sem binários, adequado à hospedagem compartilhada
- Login por e-mail e senha dentro da própria aplicação: senhas com bcrypt, sessões no banco (cookie HttpOnly de 12 horas), bloqueio de 15 minutos após 5 tentativas erradas
- SheetJS para ler as planilhas (lê também o formato gerado pelo SGA)
- Armazenamento dos PDFs: a confirmar (ver Hospedagem)

## Hospedagem (Hostinger)

Plano contratado: **Business**. Segundo a documentação da Hostinger, esse plano aceita aplicações Node.js (incluindo Next.js, com build e deploy automáticos a partir do GitHub) e inclui MySQL gerenciado.

Limites do plano que afetam o projeto:

- até 5 aplicações Node.js, com processos e memória compartilhados entre todos os sites do plano;
- cada requisição é interrompida após 120 segundos;
- não há WebSockets de entrada nem processos em segundo plano permanentes.

Nenhum desses limites atrapalha o sistema: a importação do SGA e o cálculo de ~100 consultores levam poucos segundos, e não há necessidade de tempo real.

A confirmar antes de publicar:

- se arquivos gravados em disco pela aplicação (PDFs das notas e comprovantes) sobrevivem a um novo deploy; se não, os arquivos vão para um armazenamento externo;
- o espaço em disco disponível.

## Acesso e senhas

- Não há cadastro público. O admin cria os usuários; o sistema gera uma **senha provisória**, mostrada uma única vez, que o usuário troca no primeiro acesso.
- Acesso de consultor: criado na ficha do consultor (**Consultores → nome → Acesso ao sistema**).
- Admin e financeiro: **Usuários**.
- Esqueceu a senha: o admin gera uma nova senha provisória na mesma tela.
- Bloquear um usuário encerra na hora as sessões abertas dele.

## Como rodar

Requisitos: Node.js 20 ou superior e um banco MySQL (o da Hostinger, com acesso remoto liberado, ou um local).

```bash
npm install
cp .env.example .env.local      # preencha DATABASE_URL
npm run db:migrar               # cria as tabelas
npm run criar-admin -- --email voce@empresa.com.br --nome "Seu Nome"
npm run importar-planilha -- ../Planilha.xlsx            # simulação: mostra o que faria
npm run importar-planilha -- ../Planilha.xlsx --gravar   # grava os consultores e indicações
npm run dev
```

Abra http://localhost:3000 e entre com o e-mail e a senha provisória do admin.

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm start` | Sobe o build de produção |
| `npm test` | Testes do motor de cálculo |
| `npm run lint` / `npm run typecheck` | Verificação de código |
| `npm run db:gerar` | Gera a migração SQL depois de mudar `src/db/schema.ts` |
| `npm run db:migrar` | Aplica as migrações pendentes no banco |
| `npm run criar-admin` | Cria um administrador |
| `npm run importar-planilha` | Importa consultores e indicações da Planilha Mestre |

### Importação da planilha

O importador lê as abas `CADASTRO` e `INDICACOES_2`. Cada consultor recebe como "nomes no SGA" o nome padrão e o nome do SGA da planilha. Linhas repetidas com outra grafia viram um nome a mais do mesmo consultor. Ao final, ele lista os **possíveis duplicados** para conferência manual. Na planilha atual são três:

- CARLOS ANDRE LOPES DE OLIVEIRA RIOS × CARLOS ANDRE LOPS DE OLIVEIRA RIOS
- HELTONCLEI PEREIRA DOS SANTOS × HELTONCLEI
- JEAN CARLOS DE LIMA SANTOS × JEAN CARLOS DE LIMA

Quando a chave PIX é um CPF ou CNPJ, ela também é gravada como documento do consultor; quando é telefone, também como telefone.

## Estrutura

```
src/
  app/
    login/, trocar-senha/   Acesso
    admin/                  Área do administrador (consultores, usuários, ...)
    financeiro/             Área do financeiro
    consultor/              Área do consultor
    acoes/                  Server actions compartilhadas (login, logout)
  components/               Moldura das telas e componentes visuais
  db/
    schema.ts               Tabelas do banco
    conexao.ts, index.ts    Conexão MySQL
  lib/
    auth/                   Senhas, sessões e controle de acesso por perfil
    comissoes/calculo.ts    Motor de cálculo (funções puras, com testes)
    consultores.ts          Consultas de consultores
drizzle/                    Migrações SQL geradas
scripts/                    criar-admin, importar-planilha
```

Toda página e toda ação no servidor verifica o perfil do usuário (`exigirPerfil` em `src/lib/auth/dal.ts`) antes de ler ou gravar dados. Esconder um menu não é tratado como proteção.

## Dados sensíveis

O sistema guarda dados pessoais e financeiros (CPF, CNPJ, chave PIX, valores pagos). Senhas e chaves de acesso ficam em `.env.local`, que não vai para o repositório. Planilhas com dados reais não devem ser versionadas.
