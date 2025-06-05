#!/bin/bash

# Wedding CRM Deployment Script
# Usage: ./deploy.sh [server_user] [server_ip]

set -e

echo "🚀 Starting Wedding CRM Deployment..."

# Configuration
SERVER_USER=${1:-"ubuntu"}
SERVER_IP=${2:-"your-server-ip"}
SERVER_PATH="/var/www/wedding-crm"
BUILD_NAME="wedding-crm-build-$(date +%Y%m%d_%H%M%S).tar.gz"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if build exists
if [ ! -d ".next" ]; then
    print_warning "No build found. Running build first..."
    npm run build
    print_status "Build completed"
fi

# Create deployment package
print_info "Creating deployment package..."
tar -czf $BUILD_NAME \
    .next \
    package.json \
    package-lock.json \
    public \
    components \
    lib \
    app \
    middleware.ts \
    next.config.mjs \
    tailwind.config.ts \
    tsconfig.json \
    ecosystem.config.js \
    --exclude=".next/cache" \
    --exclude="node_modules"

print_status "Deployment package created: $BUILD_NAME"

# Upload to server
print_info "Uploading to server $SERVER_USER@$SERVER_IP..."
scp $BUILD_NAME $SERVER_USER@$SERVER_IP:/tmp/

# Deploy on server
print_info "Deploying on server..."
ssh $SERVER_USER@$SERVER_IP << EOF
    set -e
    
    echo "🔄 Starting server deployment..."
    
    # Navigate to application directory
    cd $SERVER_PATH
    
    # Stop application
    echo "Stopping application..."
    pm2 stop wedding-crm || true
    
    # Backup current build
    if [ -d ".next" ]; then
        echo "Backing up current build..."
        sudo mv .next .next.backup.\$(date +%Y%m%d_%H%M%S)
    fi
    
    # Extract new build
    echo "Extracting new build..."
    sudo tar -xzf /tmp/$BUILD_NAME
    
    # Set permissions
    sudo chown -R \$USER:\$USER .
    
    # Install production dependencies
    echo "Installing dependencies..."
    npm ci --only=production --silent
    
    # Start application
    echo "Starting application..."
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Clean up
    rm /tmp/$BUILD_NAME
    
    echo "✅ Deployment completed successfully!"
    
    # Show status
    pm2 status
EOF

# Clean up local build file
rm $BUILD_NAME

print_status "Deployment completed successfully!"
print_info "Application should be running at: https://yourdomain.com"
print_info "To monitor: ssh $SERVER_USER@$SERVER_IP 'pm2 logs wedding-crm'"

echo ""
echo "🎉 Wedding CRM has been deployed successfully!"
echo ""
echo "Next steps:"
echo "1. Update your domain DNS to point to $SERVER_IP"
echo "2. Configure SSL certificate with Let's Encrypt"
echo "3. Update Supabase settings with your production domain"
echo "4. Test all functionality on production" 