# FinancasFirebase — Portfolio Analyzer

Aplicativo de finanças (portfolio/accões) com React + Vite + Firebase Realtime Database.

## Setup

```bash
npm install
cp .env.example .env   # preencha VITE_BRAPI_TOKEN
npm run dev
```

## Login (acesso restrito)

O acesso é limitado a um unico e-mail (configurado em `VITE_ALLOWED_EMAIL`, padrao: `enriqq3d@gmail.com`). Nenhum outro e-mail consegue entrar.

### 1. Habilitar autenticacao no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com) -> projeto `financasfirebase`.
2. **Build -> Authentication -> Sign-in method** e habilite o provedor **E-mail/senha**.
3. Em **Users**, adicione o usuario com o e-mail autorizado (`enriqq3d@gmail.com`) e uma senha forte.

### 2. Regras do Realtime Database (reforco no servidor)

Em **Build -> Realtime Database -> Rules**, cole:

```json
{
  "rules": {
    ".read": "auth != null && auth.token.email == 'enriqq3d@gmail.com'",
    ".write": "auth != null && auth.token.email == 'enriqq3d@gmail.com'"
  }
}
```

Com isso, mesmo que alguem altere o codigo do frontend, o banco so le/grava dados com a sessao do e-mail autorizado.

### 3. Como funciona

- `src/context/AuthContext.jsx` — estado de autenticacao e checagem do e-mail autorizado.
- `src/pages/Login.jsx` — tela de login (e-mail/senha).
- `src/App.jsx` — rotas protegidas; sem sessao, redireciona para `/login`.
- Aviso: o e-mail autorizado fica visivel no bundle (frontend); a restricao real e aplicada pelas regras do banco.

## Scripts

```bash
npm run dev     # servidor de desenvolvimento
npm run build   # build de producao
npm run lint    # oxlint
```
