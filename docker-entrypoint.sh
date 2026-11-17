#!/bin/sh
set -eu

# Upstream da API. Em Coolify na mesma rede: http://<nome-do-servico-backend>:3001
# Padrão público (Cloudflare): https://api.salesiq.app.br
BACKEND_UPSTREAM="${BACKEND_UPSTREAM:-https://api.salesiq.app.br}"
BACKEND_UPSTREAM="${BACKEND_UPSTREAM%/}"
export BACKEND_UPSTREAM

# Host enviado ao upstream (SNI / virtual host Coolify)
BACKEND_HOST="${BACKEND_HOST:-$(printf '%s' "$BACKEND_UPSTREAM" | sed -E 's|^[a-zA-Z]+://||; s|/.*||; s|:.*||')}"
export BACKEND_HOST

envsubst '${BACKEND_UPSTREAM} ${BACKEND_HOST}' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

exec nginx -g 'daemon off;'
