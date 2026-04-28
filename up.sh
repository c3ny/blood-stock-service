#!/bin/bash
set -e

echo "🚀 Subindo todos os serviços..."
docker compose up -d

echo ""
echo "✅ Serviços no ar! Containers rodando:"
docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
