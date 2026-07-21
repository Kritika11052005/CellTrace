#!/usr/bin/env bash
# Render Build Script for CellTrace Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Download Prisma binaries for Linux
python -m prisma py fetch

# Copy the fetched query engine binary to exact filenames expected by Prisma Engine
FIND_ENGINE=$(find /opt/render/.cache/prisma-python ~/.cache/prisma-python /tmp -name "prisma-query-engine*" -type f 2>/dev/null | head -n 1 || true)
if [ -n "$FIND_ENGINE" ]; then
    echo "Found query engine binary at $FIND_ENGINE, copying with exact Debian OpenSSL 3.0 target name..."
    cp "$FIND_ENGINE" ./prisma-query-engine-debian-openssl-3.0.x || true
    cp "$FIND_ENGINE" ./app/prisma/prisma-query-engine-debian-openssl-3.0.x || true
    cp "$FIND_ENGINE" ./prisma-query-engine || true
    
    chmod 755 ./prisma-query-engine* || true
    chmod 755 ./app/prisma/prisma-query-engine* || true
    chmod 755 "$FIND_ENGINE" || true
fi

# Generate Prisma client
export PRISMA_PY_DEBUG_GENERATOR=1
python -m prisma generate

# Push schema to Neon DB
python -m prisma db push --skip-generate
