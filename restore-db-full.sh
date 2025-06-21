#!/bin/bash

# Full Database Restore Script with Dependency Handling
# This script handles the complete database restore process

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Database connection details
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo -e "${YELLOW}🔄 Starting full database restore process...${NC}"

# 1. Stop all services
echo -e "${YELLOW}📥 Stopping all services...${NC}"
supabase stop || true

# 2. Start fresh Supabase instance
echo -e "${YELLOW}🚀 Starting fresh Supabase instance...${NC}"
supabase start

# 3. Wait for Postgres to be ready
echo -e "${YELLOW}⏳ Waiting for Postgres...${NC}"
until pg_isready -h localhost -p 54322 -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""

# 4. Drop and recreate database
echo -e "${YELLOW}🗑️ Recreating clean database...${NC}"
psql "postgresql://postgres:postgres@localhost:54322/postgres" << EOF
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
EOF

# 5. Create essential schemas
echo -e "${YELLOW}📦 Creating essential schemas...${NC}"
psql "$DB_URL" << EOF
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS graphql;
CREATE SCHEMA IF NOT EXISTS graphql_public;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS extensions;
EOF

# 6. Run migrations
echo -e "${YELLOW}📥 Running migrations...${NC}"
supabase migration up

# 7. Restore data from backup
echo -e "${YELLOW}📥 Restoring data from backup...${NC}"
if [ -f ~/db_backups/db_backup_20250618_095349.sql.gz ]; then
    gunzip -c ~/db_backups/db_backup_20250618_095349.sql.gz | psql "$DB_URL"
else
    echo -e "${RED}❌ Backup file not found!${NC}"
    exit 1
fi

# 8. Verify restore
echo -e "${YELLOW}🔍 Verifying restore...${NC}"
psql "$DB_URL" << EOF
\dt
SELECT COUNT(*) as company_count FROM companies;
SELECT COUNT(*) as employee_count FROM employees;
SELECT COUNT(*) as quotation_count FROM quotations;
EOF

echo -e "${GREEN}✅ Database restore process complete!${NC}" 