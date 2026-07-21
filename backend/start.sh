#!/usr/bin/env bash
# CellTrace Backend — Render Start Script
set -e

echo "=== [CellTrace] Start script begin ==="

# Safety net: if binary cache was wiped between build and start, re-fetch
CACHE_DIR="/opt/render/.cache/prisma-python/binaries"
if ! find "$CACHE_DIR" -name "prisma-query-engine*" -type f 2>/dev/null | head -n 1 | grep -q .; then
    echo "[CellTrace] Query engine not in cache, re-fetching..."
    python -m prisma py fetch || true
fi

echo "=== [CellTrace] Starting uvicorn ==="
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT
