#!/usr/bin/env bash
# Render Build Script for CellTrace Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Download Prisma binaries for Linux
python -m prisma py fetch

# Copy query engine to project root so it is stored in build container artifacts
FIND_ENGINE=$(find /opt/render/.cache ~/.cache /tmp -name "prisma-query-engine*" -type f 2>/dev/null | head -n 1 || true)
if [ -n "$FIND_ENGINE" ]; then
    echo "Found query engine binary at $FIND_ENGINE, copying to project root..."
    cp "$FIND_ENGINE" ./prisma-query-engine-debian-openssl-3.0.x || true
    cp "$FIND_ENGINE" ./app/prisma/prisma-query-engine-debian-openssl-3.0.x || true
    chmod 755 ./prisma-query-engine* || true
    chmod 755 ./app/prisma/prisma-query-engine* || true
fi

# Generate Prisma client
export PRISMA_PY_DEBUG_GENERATOR=1
python -m prisma generate

# Push schema to Neon DB
python -m prisma db push --skip-generate
