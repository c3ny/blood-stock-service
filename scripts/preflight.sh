#!/usr/bin/env bash
# Sangue Solidário — Pre-flight check
# Roda diagnósticos antes de `docker compose up` pra detectar
# problemas comuns que causaram dor em deploys anteriores.
#
# Uso: ./scripts/preflight.sh (a partir da pasta blood-stock-service/)

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "${GREEN}✓${NC} $1"; }
warn() { echo -e "${YELLOW}⚠${NC} $1"; }
fail() { echo -e "${RED}✗${NC} $1"; FAILED=1; }

FAILED=0

echo "=== Sangue Solidário — Pre-flight Check ==="
echo ""

# 1) Docker daemon
echo "[1/6] Docker daemon"
if docker info > /dev/null 2>&1; then
  ok "Docker daemon está rodando"
else
  fail "Docker daemon NÃO está rodando — inicie o Docker Desktop e tente de novo"
fi
echo ""

# 2) Portas livres
echo "[2/6] Portas livres"
PORTS_OK=1
for port in 3000 3001 3002 3003 3004 3005 3006 5432 5433 5434 5435 27017; do
  if (echo > /dev/tcp/localhost/$port) 2>/dev/null; then
    fail "Porta $port OCUPADA"
    PORTS_OK=0
  fi
done
[ "$PORTS_OK" = "1" ] && ok "Todas as 12 portas livres (3000-3006, 5432-5435, 27017)"
echo ""

# 3) .env presente e populado
echo "[3/6] Arquivo .env (compose lê variáveis daqui)"
if [ -f .env ]; then
  lines=$(wc -l < .env)
  if [ "$lines" -lt 10 ]; then
    fail ".env presente mas só tem $lines linhas (esperado ≥ 20 — provavelmente é o .env standalone, não o unificado)"
  else
    ok ".env presente com $lines linhas"
  fi
else
  fail ".env NÃO encontrado — extraia o env-pack.tar.gz na pasta sangue-solidario/ primeiro"
fi
echo ""

# 4) Sibling repos clonados
echo "[4/6] Repos siblings (devem estar em ../)"
SIBLINGS_OK=1
for sibling in sangue-solidario-nextjs users-service donation-service cdn-service-node campaign-service appointments-service-node; do
  if [ -f "../$sibling/Dockerfile" ]; then
    ok "../$sibling/Dockerfile encontrado"
  else
    fail "../$sibling/Dockerfile AUSENTE — clone o repo como sibling de blood-stock-service"
    SIBLINGS_OK=0
  fi
done
echo ""

# 5) Imagens problemáticas em cache (warning, não bloqueia)
echo "[5/6] Imagens em cache que podem causar conflito"
STALE_FOUND=0
for stale in "campaign-service-app" "blood-stock-service_campaign-service" "campaign-service-campaign-service"; do
  if docker images --format "{{.Repository}}" 2>/dev/null | grep -q "^${stale}$"; then
    warn "Imagem antiga em cache: $stale"
    warn "  Para apagar: docker rmi -f $stale"
    STALE_FOUND=1
  fi
done
[ "$STALE_FOUND" = "0" ] && ok "Nenhuma imagem antiga problemática em cache"
echo ""

# 6) Vars críticas no .env (apenas se .env existe)
echo "[6/6] Variáveis críticas no .env"
if [ -f .env ]; then
  for var in JWT_SECRET COOKIE_SECRET POSTGRES_USER POSTGRES_PASSWORD CLOUDINARY_CLOUD_NAME NEXT_PUBLIC_MAPBOX_TOKEN; do
    if grep -q "^$var=" .env 2>/dev/null; then
      val=$(grep "^$var=" .env | cut -d= -f2- | tr -d '\r\n')
      if [ -z "$val" ] || echo "$val" | grep -qE "^(change-me|pk\.xxx|placeholder|secret$|admin$)"; then
        fail "$var presente no .env mas com placeholder/vazio: '$val'"
      else
        ok "$var configurada"
      fi
    else
      fail "$var ausente no .env (necessária para compose ou build do frontend)"
    fi
  done
else
  warn "Pulando checagem de vars (.env não encontrado)"
fi
echo ""

echo "==========================================="
if [ "$FAILED" = "0" ]; then
  echo -e "${GREEN}✓ Tudo verde. Pode rodar:${NC}"
  echo "    docker compose up -d --build"
  exit 0
else
  echo -e "${RED}✗ Falhas detectadas. Resolva acima e rode novamente.${NC}"
  exit 1
fi
