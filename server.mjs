/**
 * Servidor de produção: SPA + proxy /api → backend.
 *
 * Necessário porque os Sync Agents nas lojas ainda chamam
 * https://salesiq.app.br/api/* (URL do monolito). Sem proxy, o host
 * estático devolve HTML/405 e todas as lojas ficam offline.
 *
 * Coolify: Build Pack Node (ou Dockerfile). Porta = PORT (default 3000).
 * Env: BACKEND_UPSTREAM=https://api.salesiq.app.br  (ou http://backend:3001 na rede interna)
 */
import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { pipeline } from 'node:stream'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST = path.join(__dirname, 'dist')
const PORT = Number(process.env.PORT || 3000)
const BACKEND = (process.env.BACKEND_UPSTREAM || 'https://api.salesiq.app.br').replace(/\/+$/, '')

const upstream = new URL(BACKEND)
const transport = upstream.protocol === 'https:' ? https : http

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.map': 'application/json',
}

function contentType(filePath) {
  return MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
}

function sendFile(res, filePath) {
  const stream = fs.createReadStream(filePath)
  res.writeHead(200, { 'Content-Type': contentType(filePath) })
  stream.pipe(res)
  stream.on('error', () => {
    if (!res.headersSent) res.writeHead(500).end('erro ao ler arquivo')
  })
}

function serveSpa(req, res) {
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0] || '/')
  const safe = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
  const candidate = path.join(DIST, safe === '/' || safe === '' ? 'index.html' : safe)

  if (candidate.startsWith(DIST) && fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
    return sendFile(res, candidate)
  }
  const index = path.join(DIST, 'index.html')
  if (fs.existsSync(index)) return sendFile(res, index)
  res.writeHead(404).end('dist/ não encontrado — rode npm run build')
}

function shouldProxy(urlPath) {
  return urlPath === '/health' || urlPath.startsWith('/api/')
}

function proxy(req, res) {
  const headers = { ...req.headers, host: upstream.host }
  delete headers['accept-encoding']

  const opts = {
    protocol: upstream.protocol,
    hostname: upstream.hostname,
    port: upstream.port || (upstream.protocol === 'https:' ? 443 : 80),
    path: req.url,
    method: req.method,
    headers,
    timeout: 300_000,
  }

  const pReq = transport.request(opts, (pRes) => {
    res.writeHead(pRes.statusCode || 502, pRes.headers)
    pipeline(pRes, res, () => {})
  })

  pReq.on('timeout', () => {
    pReq.destroy()
    if (!res.headersSent) res.writeHead(504).end('gateway timeout')
  })
  pReq.on('error', (err) => {
    console.error('[proxy]', err.message)
    if (!res.headersSent) res.writeHead(502).end('bad gateway')
  })

  pipeline(req, pReq, () => {})
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0] || '/'
  if (shouldProxy(urlPath)) return proxy(req, res)
  return serveSpa(req, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.info(`[sales-iq-webapp] :${PORT} → SPA + proxy /api → ${BACKEND}`)
})
