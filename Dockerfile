# syntax=docker/dockerfile:1
#
# Imagem Node com server.mjs (SPA + proxy /api → backend).
# Coolify: Build pack Dockerfile, Exposed port = 3000.
# Env: BACKEND_UPSTREAM=https://api.salesiq.app.br

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL=https://api.salesiq.app.br
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV BACKEND_UPSTREAM=https://api.salesiq.app.br

RUN apk add --no-cache wget \
  && addgroup -S nodejs && adduser -S salesiq -G nodejs

COPY --from=build --chown=salesiq:nodejs /app/dist ./dist
COPY --chown=salesiq:nodejs server.mjs ./server.mjs
COPY --chown=salesiq:nodejs package.json ./package.json

USER salesiq
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.mjs"]
