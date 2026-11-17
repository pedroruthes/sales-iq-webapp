/**
 * Fix emergencial: Sync Agents offline após split frontend/API.
 *
 * No Cloudflare → Workers → Create → cole este script.
 * Route: salesiq.app.br/*  (e www.salesiq.app.br/* se usar)
 *
 * Encaminha /api/* e /health para api.salesiq.app.br; o resto vai ao origin (SPA).
 * Remova o Worker depois de publicar o webapp com Dockerfile (nginx + proxy).
 */
export default {
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/health' || url.pathname.startsWith('/api/')) {
      url.hostname = 'api.salesiq.app.br'
      return fetch(new Request(url, request))
    }
    return fetch(request)
  },
}
