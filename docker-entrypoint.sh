#!/bin/sh
set -e

echo "🌸 Starting Daily Glow Diary in production mode..."

cd /app/packages/backend

# Ensure upload and backup directories exist
mkdir -p uploads/audio backups prisma

# Ensure schema.prisma in the volume is updated to the latest version from image
if [ -f /app/schema.prisma ]; then
  cp -f /app/schema.prisma prisma/schema.prisma
fi

# Apply schema migrations to SQLite
echo "📦 Syncing SQLite database schema..."
npx prisma db push --skip-generate

# If dev.db was just created and has 0 bytes or doesn't have users, run seed
if [ ! -f prisma/dev.db ] || [ "$(wc -c < prisma/dev.db 2>/dev/null || echo 0)" -lt 4096 ]; then
  echo "🌱 Seeding initial user data..."
  node dist/seed.js || true
fi

echo "✨ Server is blooming on port $PORT!"
exec node dist/server.js
