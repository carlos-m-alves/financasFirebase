# FinancasFirebase — Portfolio Analyzer

Aplicativo pessoal de finanças que acompanha uma carteira de investimentos em tempo real: ações brasileiras, FIIs e ativos internacionais (EUA), com cotações atualizadas, histórico de preços e indicadores de lucro/prejuízo.

## Funcionalidades

- **Login restrito**: acesso somente para o e-mail autorizado (configurado em `VITE_ALLOWED_EMAIL`).
- **Dashboard**: resumo da carteira — total investido, valor atual e lucro/prejuízo; separação automática entre ativos nacionais e internacionais (com conversão USD → BRL pelo dólar do dia); ordenação por valor ou lucro; filtro por ticker.
- **Portfolio**: cadastro, edição e exclusão de ativos (ticker, quantidade, preço pago e data da compra).
- **Detalhes do ativo**: gráfico de histórico de preços com intervalos de 1M a 2A, além de indicadores como mínima/máxima de 52 semanas e volume.
- **Atualização de cotações**: busca preços, dividendos (DY 12m) e câmbio na Brapi e salva no Firebase.
- **Modo privado**: botão que oculta todos os valores na tela.

## Tecnologias

- **React 19 + Vite 8** — interface e build.
- **React Router 7** — navegação e rotas protegidas.
- **Recharts 3** — gráficos de histórico de preços.
- **Firebase**:
  - **Authentication** (E-mail/senha) — login.
  - **Realtime Database** — carteira e histórico de preços.
  - **Hosting** — deploy do site.
- **Brapi API** — cotações, dividendos, histórico e busca de tickers.
- **AwesomeAPI** — cotação USD/BRL.
- **Axios** — chamadas HTTP.
- **Oxlint** — lint.

## Estrutura do projeto

```
src/
├── components/     # Layout, StockCard, TickerFilter, EyeToggle, ErrorBoundary
├── context/        # AuthContext, FilterContext, PrivacyContext
├── hooks/          # useStocks, usePrices
├── pages/          # Login, Dashboard, Portfolio, StockDetail
├── services/       # firebase.js (banco), brapi.js (API), seedData.js
└── utils/          # format.js
```

## Setup

```bash
npm install
cp .env.example .env   # preencha VITE_BRAPI_TOKEN e VITE_ALLOWED_EMAIL
npm run dev
```

### Variáveis de ambiente

| Variável | Descrição |
| --- | --- |
| `VITE_BRAPI_TOKEN` | Token de acesso da API Brapi (https://brapi.dev) |
| `VITE_ALLOWED_EMAIL` | Único e-mail autorizado a acessar o sistema |

## Deploy

```bash
npm run build
firebase deploy
```

## Scripts

```bash
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção
npm run lint      # oxlint
npm run preview   # pré-visualização do build
```
