# sales-iq-webapp

Frontend React (Vite) + React Router do SalesIQ.

## Desenvolvimento

```bash
# Backend precisa estar em http://localhost:3001
cp .env.example .env
npm install
npm run dev
```

App em `http://localhost:5173`.

Auth: JWT em `localStorage` (`salesiq_token`), enviado como `Authorization: Bearer`.

## Scripts

- `npm run dev` — Vite
- `npm run build` — typecheck + build de produção
- `npm run preview` — preview do build
