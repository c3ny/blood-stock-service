#!/bin/bash

echo ""
echo "=== Containers rodando ==="
echo ""

# Lista containers rodando com índice
containers=($(docker compose ps --format "{{.Name}}" 2>/dev/null))

if [ ${#containers[@]} -eq 0 ]; then
  echo "Nenhum container rodando."
  exit 1
fi

for i in "${!containers[@]}"; do
  status=$(docker inspect --format '{{.State.Status}}' "${containers[$i]}" 2>/dev/null)
  echo "  [$((i+1))] ${containers[$i]}  ($status)"
done

echo ""
echo "  [0] Todos"
echo ""
read -p "Escolha o numero ou digite o nome: " choice

if [ "$choice" = "0" ]; then
  echo ""
  echo "Reiniciando todos..."
  docker compose restart
  echo "Pronto!"
  exit 0
fi

# Se digitou numero
if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le ${#containers[@]} ]; then
  selected="${containers[$((choice-1))]}"
else
  selected="$choice"
fi

echo ""
echo "Reiniciando $selected..."
docker compose restart "$selected"
echo "Pronto!"
