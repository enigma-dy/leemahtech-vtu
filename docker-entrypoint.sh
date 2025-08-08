#!/bin/sh
set -e

echo "⏳ Waiting for Postgres to be ready..."
until nc -z db 5432; do
  sleep 1
done

echo "🚀 Running Prisma migrations..."
npx prisma migrate deploy

echo "✅ Starting NestJS..."
exec node dist/main.js
