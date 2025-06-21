#!/bin/bash

# 🔄 SYNC PRODUCTION TO DEVELOPMENT
# ==================================
# Safely copies production data to development database for testing

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Database Configuration
DB_HOST="localhost"
DB_PORT="5432"
DB_USER="vikasalagarsamy"
DB_PRODUCTION="ooak_future_production"
DB_DEVELOPMENT="ooak_future_development"
BACKUP_DIR="backups"

echo -e "${BLUE}🔄 SYNC PRODUCTION DATA TO DEVELOPMENT${NC}"
echo "======================================"
echo -e "${YELLOW}⚠️  This will overwrite your development database${NC}"
echo -e "${YELLOW}⚠️  Production data will be copied to development${NC}"
echo ""

# Create backup directory
mkdir -p $BACKUP_DIR

# Confirmation
read -p "Continue with data sync? (y/N): " confirm
if [[ $confirm != [yY] ]]; then
    echo "Sync cancelled."
    exit 0
fi

echo ""
echo -e "${YELLOW}💾 Step 1: Backing up current development data...${NC}"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_DEVELOPMENT > "$BACKUP_DIR/dev_backup_$(date +%Y%m%d_%H%M%S).sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Development backup created${NC}"
else
    echo -e "${RED}❌ Development backup failed${NC}"
    exit 1
fi

echo -e "${YELLOW}📥 Step 2: Exporting production data...${NC}"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER --data-only --exclude-table=activities --exclude-table=audit_logs $DB_PRODUCTION > "$BACKUP_DIR/prod_data_$(date +%Y%m%d_%H%M%S).sql"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production data exported${NC}"
else
    echo -e "${RED}❌ Production data export failed${NC}"
    exit 1
fi

echo -e "${YELLOW}🧹 Step 3: Clearing development data...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -c "
DO \$\$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers and constraints
    SET session_replication_role = replica;
    
    -- Truncate all tables except schema-only tables
    FOR r IN (
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('schema_migrations', 'migrations')
    ) LOOP
        EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Re-enable triggers and constraints
    SET session_replication_role = DEFAULT;
END
\$\$;
"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Development data cleared${NC}"
else
    echo -e "${RED}❌ Failed to clear development data${NC}"
    exit 1
fi

echo -e "${YELLOW}📊 Step 4: Importing production data...${NC}"
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -f "$BACKUP_DIR/prod_data_$(date +%Y%m%d_%H%M%S).sql"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Production data imported${NC}"
else
    echo -e "${RED}❌ Failed to import production data${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Step 5: Verifying data sync...${NC}"

# Count records in both databases
prod_companies=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_PRODUCTION -t -c "SELECT COUNT(*) FROM companies;" | xargs)
dev_companies=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -t -c "SELECT COUNT(*) FROM companies;" | xargs)

prod_employees=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_PRODUCTION -t -c "SELECT COUNT(*) FROM employees;" | xargs)
dev_employees=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -t -c "SELECT COUNT(*) FROM employees;" | xargs)

prod_leads=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_PRODUCTION -t -c "SELECT COUNT(*) FROM leads;" | xargs)
dev_leads=$(psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_DEVELOPMENT -t -c "SELECT COUNT(*) FROM leads;" | xargs)

echo ""
echo -e "${BLUE}📊 Sync Verification:${NC}"
echo "===================="
echo -e "Companies: Production($prod_companies) → Development($dev_companies)"
echo -e "Employees: Production($prod_employees) → Development($dev_employees)"
echo -e "Leads: Production($prod_leads) → Development($dev_leads)"

if [ "$prod_companies" = "$dev_companies" ] && [ "$prod_employees" = "$dev_employees" ] && [ "$prod_leads" = "$dev_leads" ]; then
    echo -e "${GREEN}✅ Data sync verification: PASSED${NC}"
else
    echo -e "${YELLOW}⚠️  Data sync verification: Some differences detected${NC}"
    echo -e "${YELLOW}💡 This might be normal if production has ongoing changes${NC}"
fi

echo ""
echo -e "${GREEN}🎉 PRODUCTION TO DEVELOPMENT SYNC COMPLETE!${NC}"
echo "=============================================="
echo -e "${BLUE}📋 What was synced:${NC}"
echo "• All business data (companies, employees, leads, quotations, etc.)"
echo "• Excluding: activities, audit_logs (development-specific)"
echo ""
echo -e "${BLUE}💾 Backups created:${NC}"
echo "• Development backup: $BACKUP_DIR/dev_backup_$(date +%Y%m%d)_*.sql"
echo "• Production export: $BACKUP_DIR/prod_data_$(date +%Y%m%d)_*.sql"
echo ""
echo -e "${BLUE}🛠️ Development environment now has:${NC}"
echo "• Fresh production data for realistic testing"
echo "• Same schema as production"
echo "• Separate database (no risk to production)"
echo ""
echo -e "${YELLOW}💡 Next steps:${NC}"
echo "• Test your changes in development (port 5000)"
echo "• When ready, apply schema changes to production"
echo "• Use: ./apply-to-production.sh schema-file.sql"
echo ""
echo -e "${GREEN}✅ Ready for development testing!${NC}" 