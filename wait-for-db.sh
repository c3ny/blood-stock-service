#!/bin/bash

# Wait-for-database script
# This script waits for PostgreSQL to be ready before starting the application

HOST=${1:-db}
PORT=${2:-5432}
USER=${3:-postgres}
TIMEOUT=${4:-30}

echo "Waiting for PostgreSQL at $HOST:$PORT..."

for i in $(seq 1 $TIMEOUT); do
  if nc -z "$HOST" "$PORT" 2>/dev/null; then
    echo "✓ PostgreSQL is ready!"
    exit 0
  fi
  
  echo "  Attempt $i/$TIMEOUT failed. Retrying in 1 second..."
  sleep 1
done

echo "✗ PostgreSQL did not become ready within $TIMEOUT seconds"
exit 1
