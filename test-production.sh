#!/bin/bash
echo "🧪 Testing production build locally..."

# Build and start production Docker container
docker-compose -f docker-compose.local.yml up --build

echo "🌐 Application should be available at http://localhost:3000"
