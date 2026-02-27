#!/bin/bash
# Build script that handles optional database migration

echo "Building client and server..."
tsx script/build.ts

if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set - skipping drizzle-kit generate"
else
  echo "Running drizzle-kit generate..."
  drizzle-kit generate
fi

echo "✅ Build completed successfully"
