# Deploy no Coolify — sales-iq-webapp

## Por que o Sync Agent ficou offline

Os agentes nas lojas usam `SALESIQ_API_URL=https://salesiq.app.br` (URL do monolito Next).

Depois do split:

| Domínio | Serviço |
| --- | --- |
| `https://salesiq.app.br` | Frontend (Vite/SPA) |
| `https://api.salesiq.app.br` | Backend (Express) |

Sem proxy, `GET /api/sync/health` em `salesiq.app.br` devolve **HTML do SPA** e `POST /api/*` devolve **405**. O agente acha a API morta → todas as lojas **offline**.

O `Dockerfile` deste repo sobe um **nginx** que:

1. Serve o SPA
2. Faz proxy de `/api/` (e `/health`) para `BACKEND_UPSTREAM` (padrão `https://api.salesiq.app.br`)

## Build (obrigatório: processo com proxy `/api`)

Se o Coolify publicar só a pasta `dist` (static), **o Sync Agent fica offline de novo**.
Use uma destas opções:

### Opção A — Dockerfile (recomendado)

| Campo | Valor |
| --- | --- |
| Build pack | **Dockerfile** |
| Base directory | `/` (repo só do webapp) ou `sales-iq-webapp` no monorepo |
| Dockerfile | `/Dockerfile` |
| Exposed port | **`3000`** |
| Domínio | `https://salesiq.app.br` (+ `www` se quiser) |
| Env | `BACKEND_UPSTREAM=https://api.salesiq.app.br` |

### Opção B — Nixpacks / Node

| Campo | Valor |
| --- | --- |
| Build pack | **Nixpacks** (não Static) |
| Build command | `npm ci && npm run build` |
| Start command | `npm run start` (= `node server.mjs`) |
| Exposed port | **`3000`** |
| Env | `BACKEND_UPSTREAM=https://api.salesiq.app.br` |

Há `nixpacks.toml` e `Procfile` no repo para forçar o start com proxy.

### Build args

| Arg | Default | Uso |
| --- | --- | --- |
| `VITE_API_URL` | `https://api.salesiq.app.br` | URL que o **browser** chama (JWT) |

### Runtime env

| Variável | Default | Uso |
| --- | --- | --- |
| `BACKEND_UPSTREAM` | `https://api.salesiq.app.br` | Destino do proxy `/api` (Sync Agent). Na rede interna Coolify: `http://<serviço-backend>:3001` |

## Alternativa sem redeploy do frontend (Traefik)

No serviço **backend**, adicione também o host `salesiq.app.br` com regra de path `/api` (labels Traefik / “Custom labels” no Coolify), com prioridade maior que o SPA. O frontend continua no mesmo domínio para o resto das rotas.

## Validação

```bash
# Deve ser JSON do Sync Engine — NÃO HTML
curl -sS https://salesiq.app.br/api/sync/health

# Deve ser 401 JSON (API Key inválida), NÃO 405
curl -sS -o /dev/null -w "%{http_code}\n" \
  -X POST https://salesiq.app.br/api/sync/batch \
  -H 'Authorization: Bearer x' -H 'Content-Type: application/json' -d '{}'
```

Esperado após o fix: `200` no health (JSON) e `401` no batch.

## Sync Agent (novas instalações)

```env
SALESIQ_API_URL=https://api.salesiq.app.br
```

Lojas já instaladas podem continuar em `https://salesiq.app.br` **desde que** o proxy `/api` esteja ativo.
