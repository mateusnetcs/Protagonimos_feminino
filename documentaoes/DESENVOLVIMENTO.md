# Guia de Desenvolvimento – Jornada do Produtor

Este documento define como organizar e evoluir o projeto **Jornada do Produtor / Inovação Imperatriz**.

## Estrutura de pastas principal

- `app/`
  - `layout.tsx`: layout raiz do Next (fonte, HTML, `<body>`).
  - `page.tsx`: **apenas roteia** entre as telas (landing, questionário, login, gestão).
- `components/`
  - `LandingPage.tsx`: landing institucional.
  - `SurveyApp.tsx`: fluxo completo do questionário.
  - `LoginView.tsx`: tela de login de gestão.
  - `ManagementView.tsx`: **container** do painel (cabeçalho, abas, roteamento entre telas).
  - `management/`: telas usadas **dentro** do painel (uma responsabilidade por arquivo):
    - `ResponsesView.tsx` — aba Respostas (tabela + modal de detalhe).
    - `ProductsTabView.tsx` — listagem da aba Produtos.
    - `CatalogManagementTab.tsx` — aba Catálogo (link público + `CatalogView`).
  - `pdv/`
    - `PDVView.tsx` — ponto de venda (mobile + desktop + configurações).
- `types/`
  - `survey.ts`: tipo `SurveyResponse` compartilhado (API de respostas / gestão).
- `lib/`
  - `supabase.ts`: client compartilhado do Supabase.

## Regra de tamanho dos arquivos

- **Meta forte**: cada arquivo de tela/componente não deve ultrapassar **1000 linhas**.
- Se um componente começar a crescer demais:
  - Extraia subcomponentes para `components/` (por exemplo, `PDVProductGrid`, `PDVCartSidebar`, `SurveyStep1` etc.).
  - Agrupe componentes relacionados em subpastas, se necessário:
    - `components/pdv/*` — tudo relacionado ao PDV.
    - `components/management/*` — telas do painel de gestão (aba = arquivo quando fizer sentido).
    - `components/survey/*` — passos ou blocos do questionário.

## Padrão para novas telas

Sempre que criar uma nova tela (por exemplo, relatórios, catálogo, produtos):

1. Crie um componente em `components/`:
   - Exemplo: `components/ReportsView.tsx`.
2. Importe e use a tela no container adequado:
   - Para telas de gestão: criar o componente em `components/management/` (ou `components/` se for isolado), adicionar a aba em `ManagementView.tsx` e renderizar o componente lá.
3. Mantenha a tela **autônoma**:
   - Estado local dentro do componente.
   - Hooks externos (`useXyz`) em `hooks/` se forem reutilizáveis.

## Boas práticas de desenvolvimento

- **Componentização**
  - Componentes pequenos, focados em uma responsabilidade.
  - Reaproveitar padrões visuais (cards, headers, botões) sempre que possível.

- **Estado e lógica**
  - Telas principais podem usar `useState`/`useEffect` diretamente.
  - Lógicas de acesso a dados mais complexas podem ir para hooks em `hooks/` ou funções em `lib/`.

- **Supabase**
  - Usar sempre `getSupabase()` de `lib/supabase.ts`.
  - As credenciais devem vir de variáveis de ambiente:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Nunca versionar chaves sensíveis em arquivos fora de `.env.local`.

- **Estilização**
  - Utilizar classes Tailwind **sem** estilos inline sempre que possível.
  - Manter consistência de espaçamentos (`px-4`, `py-4`, `gap-4`, `rounded-xl`, etc.).

- **Responsividade**
  - Sempre testar em mobile e desktop.
  - Usar os breakpoints padrão (`sm`, `md`, `lg`, `xl`) de forma consistente.
  - Para telas “tipo app” (como PDV e Survey), priorizar experiência mobile, mas com boa experiência em desktop (centralizar, adicionar colunas laterais, etc.).

## Fluxo de navegação atual

- `LandingPage` → botão “Participar” → `SurveyApp`.
- `LandingPage` → botão “Gestão” → `LoginView`.
- `LoginView` (login sucesso) → `ManagementView`.
- `ManagementView`:
  - Aba **Respostas**: tabela + detalhes de respostas do formulário.
  - Aba **PDV**: ponto de venda rápido, inspirado no layout mobile.
  - Abas **Catálogo** / **Produtos**: placeholder de “Em desenvolvimento”.

## Como adicionar novas funcionalidades

1. **Nova aba no painel de gestão**
   - Adicionar opção no state `activeTab` em `ManagementView.tsx`.
   - Criar um novo componente em `components/` (por exemplo `CatalogView.tsx`).
   - Renderizar o novo componente quando `activeTab === 'catalogo'`.

2. **Nova pergunta no questionário**
   - Editar `SurveyApp.tsx`.
   - Incluir o campo no objeto `answers`.
   - Atualizar o `insert` do Supabase com a nova coluna (e garantir que exista na migration).
   - Criar um novo bloco de UI no step correspondente (idealmente extraindo em um subcomponente se ficar grande).

3. **Integração de novas tabelas Supabase (ex: vendas do PDV)**
   - Criar migrations em `supabase/migrations/`.
   - Adicionar funções de leitura/gravação em `ManagementView.tsx` ou em um hook separado (por exemplo `useSales`).
   - Nunca colocar chaves ou URLs direto no código; sempre via `.env.local`.

4. **Pagamentos no PDV (PIX e maquininha)**
   - Consulte `documentaoes/CONFIGURACAO-PAGAMENTO-PDV.md` para as variáveis de ambiente necessárias.
   - Chaves: `PDV_PIX_CHAVE`, `NEXT_PUBLIC_PDV_PIX_CHAVE`, `PDV_MAQUINA_*`.

## Convenções gerais

- **Idiomas**: textos da interface em português, variáveis e código em inglês (ex.: `surveyResponses`, `productList`, `handleSubmit`).
- **Nomes de componentes**: sempre em PascalCase (`ManagementView`, `PDVView`, `SurveyStepHeader`).
- **Nomes de arquivos**: também em PascalCase para componentes (`ManagementView.tsx`) e `kebab-case` para utilitários se necessário (`format-currency.ts`).

Seguindo estas regras, o projeto fica mais fácil de manter, contribuir e evoluir (inclusive por outras pessoas). Se um arquivo começar a se aproximar de 1000 linhas, considere **obrigatoriamente** quebrá‑lo em componentes menores dentro de `components/`.

