#!/usr/bin/env bash
# CellTrace Backend — Render Start Script
set -e

echo "=== [CellTrace] Start script begin ==="

# The build step copies the engine binary to the project root.
# If it's there, point Prisma directly at it via env var.
ENGINE_FILE="./prisma-query-engine-debian-openssl-3.0.x"

if [ -f "$ENGINE_FILE" ] && [ -x "$ENGINE_FILE" ]; then
    export PRISMA_QUERY_ENGINE_BINARY="$(pwd)/prisma-query-engine-debian-openssl-3.0.x"
    echo "[CellTrace] Using engine from project root: $PRISMA_QUERY_ENGINE_BINARY ($(stat -c%s "$ENGINE_FILE") bytes)"
else
    echo "[CellTrace] Engine not in project root, fetching..."
    python -m prisma py fetch || true

    # Find wherever it downloaded to and copy + set env var
    FOUND=$(find /opt/render/.cache/prisma-python ~/.cache/prisma-python /tmp -type f \( -name "prisma-query-engine*" -o -name "query-engine-*" \) ! -name "*.py" ! -name "*.json" 2>/dev/null | head -n 1 || true)
    if [ -n "$FOUND" ]; then
        cp "$FOUND" "$ENGINE_FILE"
        chmod 755 "$ENGINE_FILE"
        export PRISMA_QUERY_ENGINE_BINARY="$(pwd)/prisma-query-engine-debian-openssl-3.0.x"
        echo "[CellTrace] Fetched and copied engine: $PRISMA_QUERY_ENGINE_BINARY"
    else
        echo "[CellTrace] ERROR: Could not find engine binary anywhere!"
    fi
fi

echo "=== [CellTrace] Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
