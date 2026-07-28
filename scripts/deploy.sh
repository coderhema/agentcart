#!/bin/bash
set -e

echo "=== AgentCart Deploy Script ==="

# Build
npm run build

# Run migrations
npm run db:migrate

# Seed products
npm run db:seed

echo "Deploy complete. Start with: npm start"