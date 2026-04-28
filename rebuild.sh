#!/bin/bash

echo ""
echo "=== Serviços disponíveis ==="
echo ""

# Lista serviços do compose (não containers de banco)
services=($(docker compose config --services 2>/dev/null | grep -v "^postgres\|^mongo"))

if [ ${#services[@]} -eq 0 ]; then
  echo "Nenhum serviço encontrado no docker-compose."
  exit 1
fi

for i in "${!services[@]}"; do
  status=$(docker compose ps --format "{{.Status}}" "${services[$i]}" 2>/dev/null)
  [ -z "$status" ] && status="parado"
  echo "  [$((i+1))] ${services[$i]}  ($status)"
done

echo ""
echo "  [0] Todos"
echo ""
read -p "Escolha o numero ou digite o nome: " choice

if [ "$choice" = "0" ]; then
  echo ""
  echo "Rebuildando todos os serviços..."
  docker compose up -d --build
  echo ""
  echo "Pronto!"
  exit 0
fi

# Se digitou numero
if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#services[@]} ]; then
  selected="${services[$((choice-1))]}"
else
  selected="$choice"
fi

echo ""
echo "Rebuildando $selected..."
docker compose up -d --build "$selected"
echo ""
echo "Pronto!"
