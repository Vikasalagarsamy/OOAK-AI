#!/bin/bash

echo "🛡️  SAFE DATA PULL: Production → Development"
echo "============================================="
echo ""

# Configuration
PROD_DB="ooak_future_production"
DEV_DB="ooak_future"
BACKUP_DIR="backups"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Create backup directory
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📋 This script will:${NC}"
echo "1. Backup your current development data"
echo "2. Pull fresh data from production"
echo "3. Preserve your development schema changes"
echo ""

read -p "Continue? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}💾 Step 1: Backing up development data...${NC}"
pg_dump -h localhost -p 5432 -U vikasalagarsamy $DEV_DB > "$BACKUP_DIR/dev_backup_$(date +%Y%m%d_%H%M%S).sql"
echo -e "${GREEN}✅ Development backup created${NC}"

echo ""
echo -e "${YELLOW}📥 Step 2: Pulling production data...${NC}"
pg_dump -h localhost -p 5432 -U vikasalagarsamy --data-only $PROD_DB > "$BACKUP_DIR/prod_data_$(date +%Y%m%d_%H%M%S).sql"

# Clear development data and insert production data
psql -h localhost -p 5432 -U vikasalagarsamy -d $DEV_DB -c "
DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers and constraints
    SET session_replication_role = replica;
    
    -- Truncate all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers and constraints
    SET session_replication_role = DEFAULT;
END
\$\$;
"

# Import production data
psql -h localhost -p 5432 -U vikasalagarsamy -d $DEV_DB -f "$BACKUP_DIR/prod_data_$(date +%Y%m%d_%H%M%S).sql"

echo -e "${GREEN}✅ Production data imported to development${NC}"

echo ""
echo -e "${GREEN}🎉 Safe data pull completed!${NC}"
echo -e "${YELLOW}📊 Your development now has fresh production data for testing${NC}"
echo -e "${YELLOW}💾 Backups saved in: $BACKUP_DIR/${NC}" 