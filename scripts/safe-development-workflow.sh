#!/bin/bash

echo "🛡️  SAFE DEVELOPMENT WORKFLOW"
echo "============================="
echo "Following Industry Best Practices"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database names
DEV_DB="ooak_future"
STAGING_DB="ooak_future_staging"
PROD_DB="ooak_future_production"

show_menu() {
    echo -e "${BLUE}🔧 Development Workflow Options:${NC}"
    echo "================================="
    echo "1. 📥 Pull Production Data to Development (SAFE)"
    echo "2. 🧪 Create Staging Environment"
    echo "3. 🚀 Deploy Schema Changes to Staging"
    echo "4. ✅ Deploy Approved Changes to Production"
    echo "5. 📊 Check Environment Status"
    echo "6. 🛡️  Emergency: Restore Production from Backup"
    echo "7. ❌ Exit"
    echo ""
}

pull_production_to_dev() {
    echo -e "${YELLOW}📥 Pulling Production Data to Development...${NC}"
    echo "This is SAFE - pulling FROM production TO development"
    echo ""
    
    read -p "Are you sure you want to overwrite development data? (y/N): " confirm
    if [[ $confirm != [yY] ]]; then
        echo "Operation cancelled."
        return
    fi
    
    echo "🔄 Starting safe data pull..."
    node scripts/production-sync-advanced.cjs restore
    echo -e "${GREEN}✅ Development data updated from production${NC}"
}

create_staging() {
    echo -e "${YELLOW}🧪 Creating Staging Environment...${NC}"
    
    # Create staging database if it doesn't exist
    psql -h localhost -p 5432 -U vikasalagarsamy -d postgres -c "SELECT 1 FROM pg_database WHERE datname = '$STAGING_DB'" | grep -q 1
    if [ $? -ne 0 ]; then
        echo "Creating staging database..."
        createdb -h localhost -p 5432 -U vikasalagarsamy $STAGING_DB
        echo -e "${GREEN}✅ Staging database created${NC}"
    else
        echo -e "${GREEN}✅ Staging database already exists${NC}"
    fi
    
    # Copy production schema and data to staging
    echo "📋 Copying production structure to staging..."
    pg_dump -h localhost -p 5432 -U vikasalagarsamy $PROD_DB | psql -h localhost -p 5432 -U vikasalagarsamy $STAGING_DB
    echo -e "${GREEN}✅ Staging environment ready${NC}"
}

deploy_to_staging() {
    echo -e "${YELLOW}🚀 Deploying Schema Changes to Staging...${NC}"
    echo "This deploys your development schema to staging for testing"
    echo ""
    
    read -p "Enter migration/schema file to deploy: " schema_file
    if [ ! -f "$schema_file" ]; then
        echo -e "${RED}❌ Schema file not found: $schema_file${NC}"
        return
    fi
    
    echo "🔄 Applying schema changes to staging..."
    psql -h localhost -p 5432 -U vikasalagarsamy -d $STAGING_DB -f "$schema_file"
    echo -e "${GREEN}✅ Schema deployed to staging${NC}"
    echo -e "${BLUE}🧪 Test your changes at: http://localhost:5000 (staging)${NC}"
}

deploy_to_production() {
    echo -e "${RED}🚀 PRODUCTION DEPLOYMENT${NC}"
    echo "========================"
    echo -e "${YELLOW}⚠️  This will affect live production data!${NC}"
    echo ""
    
    read -p "Have you tested this in staging? (y/N): " tested
    if [[ $tested != [yY] ]]; then
        echo -e "${RED}❌ Please test in staging first!${NC}"
        return
    fi
    
    read -p "Enter the approved schema file: " schema_file
    if [ ! -f "$schema_file" ]; then
        echo -e "${RED}❌ Schema file not found: $schema_file${NC}"
        return
    fi
    
    echo -e "${RED}⚠️  FINAL CONFIRMATION ⚠️${NC}"
    read -p "Deploy '$schema_file' to PRODUCTION? Type 'DEPLOY' to confirm: " final_confirm
    if [[ $final_confirm != "DEPLOY" ]]; then
        echo "Deployment cancelled."
        return
    fi
    
    # Create backup first
    echo "💾 Creating production backup..."
    pg_dump -h localhost -p 5432 -U vikasalagarsamy $PROD_DB > "backups/prod_backup_$(date +%Y%m%d_%H%M%S).sql"
    
    # Apply changes
    echo "🚀 Applying changes to production..."
    psql -h localhost -p 5432 -U vikasalagarsamy -d $PROD_DB -f "$schema_file"
    echo -e "${GREEN}✅ Production deployment complete${NC}"
}

check_status() {
    echo -e "${BLUE}📊 Environment Status:${NC}"
    echo "====================="
    
    # Check databases
    for db in $DEV_DB $STAGING_DB $PROD_DB; do
        psql -h localhost -p 5432 -U vikasalagarsamy -d $db -c "SELECT 1" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            count=$(psql -h localhost -p 5432 -U vikasalagarsamy -d $db -t -c "SELECT COUNT(*) FROM companies" 2>/dev/null || echo "0")
            echo -e "${GREEN}✅ $db: Connected (${count// /} companies)${NC}"
        else
            echo -e "${RED}❌ $db: Not accessible${NC}"
        fi
    done
    
    # Check running services
    echo ""
    echo -e "${BLUE}🖥️  Running Services:${NC}"
    echo "==================="
    
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Development (Port 3000): Running${NC}"
    else
        echo -e "${RED}❌ Development (Port 3000): Not running${NC}"
    fi
    
    if lsof -i :4000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Production (Port 4000): Running${NC}"
    else
        echo -e "${RED}❌ Production (Port 4000): Not running${NC}"
    fi
    
    if lsof -i :5000 > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Staging (Port 5000): Running${NC}"
    else
        echo -e "${YELLOW}⚪ Staging (Port 5000): Not running${NC}"
    fi
}

# Main menu loop
while true; do
    show_menu
    read -p "Choose an option (1-7): " choice
    echo ""
    
    case $choice in
        1) pull_production_to_dev ;;
        2) create_staging ;;
        3) deploy_to_staging ;;
        4) deploy_to_production ;;
        5) check_status ;;
        6) echo "🛡️  Emergency restore procedures would go here" ;;
        7) echo "Goodbye!"; exit 0 ;;
        *) echo -e "${RED}❌ Invalid option${NC}" ;;
    esac
    
    echo ""
    read -p "Press Enter to continue..."
    echo ""
done 