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

# 3. Verify the binary is where Prisma expects it
find /opt/render/.cache/prisma-python -name "prisma-query-engine*" -type f 2>/dev/null || true

# 4. Push schema to Neon DB
python -m prisma db push --skip-generate
echo "[build] Schema pushed to database"
