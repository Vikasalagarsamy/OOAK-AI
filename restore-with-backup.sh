#!/bin/bash

# Restore with Backup Script
# This script uses Supabase's built-in tools to restore with our backup

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🔄 Starting database restore process...${NC}"

# 1. Stop all services
echo -e "${YELLOW}📥 Stopping all services...${NC}"
supabase stop

# 2. Create a temporary SQL file that combines schema and data
echo -e "${YELLOW}📥 Preparing backup file...${NC}"
TEMP_SQL="/tmp/combined_backup.sql"

# First, add schema creation
cat > "$TEMP_SQL" << 'EOF'
-- Create essential schemas
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS storage;
CREATE SCHEMA IF NOT EXISTS graphql;
CREATE SCHEMA IF NOT EXISTS graphql_public;
CREATE SCHEMA IF NOT EXISTS realtime;
CREATE SCHEMA IF NOT EXISTS extensions;

-- Grant necessary permissions
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
GRANT ALL ON SCHEMA auth TO postgres;
GRANT ALL ON SCHEMA storage TO postgres;
GRANT ALL ON SCHEMA graphql TO postgres;
GRANT ALL ON SCHEMA graphql_public TO postgres;
GRANT ALL ON SCHEMA realtime TO postgres;
GRANT ALL ON SCHEMA extensions TO postgres;
EOF

# Append our backup data
if [ -f ~/db_backups/db_backup_20250618_095349.sql.gz ]; then
    gunzip -c ~/db_backups/db_backup_20250618_095349.sql.gz >> "$TEMP_SQL"
else
    echo -e "${RED}❌ Backup file not found!${NC}"
    exit 1
fi

# 3. Start Supabase with a fresh database
echo -e "${YELLOW}🚀 Starting Supabase with fresh database...${NC}"
FRESH_DB=true supabase start

# 4. Wait for database to be ready
echo -e "${YELLOW}⏳ Waiting for database...${NC}"
until pg_isready -h localhost -p 54322 -U postgres > /dev/null 2>&1; do
    echo -n "."
    sleep 1
done
echo ""

# 5. Apply our combined backup
echo -e "${YELLOW}📥 Applying backup...${NC}"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres -f "$TEMP_SQL"

# 6. Run migrations
echo -e "${YELLOW}📥 Running migrations...${NC}"
supabase migration up

# 7. Clean up
rm "$TEMP_SQL"

# 8. Verify restore
echo -e "${YELLOW}🔍 Verifying restore...${NC}"
PGPASSWORD=postgres psql -h localhost -p 54322 -U postgres -d postgres << EOF
\dt
SELECT COUNT(*) as company_count FROM companies;
SELECT COUNT(*) as employee_count FROM employees;
SELECT COUNT(*) as quotation_count FROM quotations;
EOF

echo -e "${GREEN}✅ Database restore process complete!${NC}" 