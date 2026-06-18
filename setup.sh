#!/usr/bin/env bash
# ============================================================================
# GQG System - setup de un comando.
# 1) genera credenciales (solo la primera vez) y las escribe en .env
# 2) levanta todo el docker (MariaDB + Adminer + app Next)
# 3) recarga nginx (si esta en este server) para publicar gqg.ianmrc.dev
# Uso:  ./setup.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

COMPOSE="docker compose -f docker-compose.yml -f docker-compose.prod.yml"

if [ ! -f .env ]; then
  echo "==> Generando credenciales nuevas en .env ..."
  cp .env.example .env
  rep() { sed -i "s|^$1=.*|$1=$2|" .env; }

  DB_ROOT="$(openssl rand -hex 16)"
  DB_PASS="$(openssl rand -hex 16)"
  ADMIN_PASS="$(openssl rand -hex 6)"     # 12 hex
  SECRET="$(openssl rand -hex 32)"

  rep MARIADB_ROOT_PASSWORD "$DB_ROOT"
  rep MARIADB_PASSWORD "$DB_PASS"
  rep DB_PASSWORD "$DB_PASS"
  rep ADMIN_PASSWORD "$ADMIN_PASS"
  rep AUTH_SECRET "$SECRET"

  echo "    Credenciales generadas."
  echo "    LOGIN -> usuario: admin   contrasena: $ADMIN_PASS"
else
  echo "==> .env ya existe: reuso las credenciales."
  echo "    (la contrasena del admin esta en ADMIN_PASSWORD del .env)"
fi

echo "==> Levantando Docker (MariaDB + Adminer + app)..."
$COMPOSE --profile app up -d --build

# recargar nginx si esta corriendo en este host (publica gqg.ianmrc.dev)
if docker ps --format '{{.Names}}' | grep -qx nginx; then
  echo "==> Recargando nginx..."
  docker exec nginx openresty -s reload -c /etc/nginx/nginx.conf >/dev/null 2>&1 || true
fi

APP_PORT="$(grep -E '^APP_PORT=' .env | cut -d= -f2)"
echo ""
echo "Listo. La app esta arriba en:"
echo "  https://gqg.ianmrc.dev        (publico, via nginx)"
echo "  http://localhost:${APP_PORT:-3000}   (local)"
echo "  Adminer (BD): http://localhost:$(grep -E '^ADMINER_PORT=' .env | cut -d= -f2)"
echo "  Login: admin / (ADMIN_PASSWORD del .env)"
