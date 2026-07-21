#!/usr/bin/env bash
# Render Build Script for CellTrace Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# 1. Fetch Prisma query-engine binary for this Linux platform
python -m prisma py fetch
echo "[build] Prisma binaries fetched"

# 2. Regenerate the Prisma client ON LINUX so client.py contains
#    the correct debian-openssl-3.0.x binary path (not Windows)
export PRISMA_PY_DEBUG_GENERATOR=1
python -m prisma generate
echo "[build] Prisma client generated for $(uname -s)"

# 3. Copy the query engine binary INTO the project directory
#    (Render wipes /opt/render/.cache between build and deploy!)
ENGINE_BIN=$(find /opt/render/.cache/prisma-python ~/.cache/prisma-python /tmp -type f \( -name "prisma-query-engine*" -o -name "query-engine-*" \) ! -name "*.py" ! -name "*.json" 2>/dev/null | head -n 1 || true)

if [ -n "$ENGINE_BIN" ]; then
    echo "[build] Found engine binary: $ENGINE_BIN ($(stat -c%s "$ENGINE_BIN") bytes)"
    cp "$ENGINE_BIN" ./prisma-query-engine-debian-openssl-3.0.x
    chmod 755 ./prisma-query-engine-debian-openssl-3.0.x
    echo "[build] Copied engine to project root ✓"
    ls -la ./prisma-query-engine-debian-openssl-3.0.x
else
    echo "[build] WARNING: Could not find engine binary in cache!"
    find /opt/render/.cache/prisma-python -type f 2>/dev/null || echo "(no cache files found)"
fi

# 4. Push schema to Neon DB
python -m prisma db push --skip-generate
echo "[build] Schema pushed to database"
