#!/usr/bin/env bash
# Render Build Script for CellTrace Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Download Prisma binaries for Linux (debian-openssl-3.0.x)
python -m prisma py fetch

# Copy the fetched query engine binary directly into project root & app/prisma
FIND_ENGINE=$(find /opt/render/.cache/prisma-python ~/.cache/prisma-python -name "prisma-query-engine*" 2>/dev/null | head -n 1 || true)
if [ -n "$FIND_ENGINE" ]; then
    echo "Found query engine at $FIND_ENGINE, copying to project root and app/prisma..."
    cp "$FIND_ENGINE" ./prisma-query-engine-debian-openssl-3.0.x || true
    cp "$FIND_ENGINE" ./app/prisma/prisma-query-engine-debian-openssl-3.0.x || true
    chmod +x ./prisma-query-engine-debian-openssl-3.0.x || true
    chmod +x ./app/prisma/prisma-query-engine-debian-openssl-3.0.x || true
fi

# Generate Prisma client
export PRISMA_PY_DEBUG_GENERATOR=1
python -m prisma generate

# Push schema to Neon DB
python -m prisma db push --skip-generate
