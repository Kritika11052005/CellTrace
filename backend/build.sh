#!/usr/bin/env bash
# Render Build Script for CellTrace Backend
set -o errexit

pip install --upgrade pip
pip install -r requirements.txt

# Generate Prisma client into app/prisma (matching schema.prisma output path)
export PRISMA_PY_DEBUG_GENERATOR=1
python -m prisma generate

# Push schema to Neon DB (creates tables if they don't exist)
python -m prisma db push --skip-generate
