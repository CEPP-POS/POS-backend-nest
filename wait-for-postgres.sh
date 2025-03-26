#!/bin/sh

echo "⏳ Waiting for PostgreSQL to be ready at $DB_HOST:$DB_PORT..."

# รอจนกว่าจะ connect DB ได้
until nc -z $DB_HOST $DB_PORT; do
  echo "🔄 Still waiting for $DB_HOST:$DB_PORT..."
  sleep 1
done

echo "✅ PostgreSQL is ready. Starting NestJS..."
node dist/main
