#!/bin/bash

# Database Restore Script
# Safely restores database from backup without using dangerous commands

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backup file is provided
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Please provide the backup file path${NC}"
    echo -e "${YELLOW}Usage: $0 <backup_file_path>${NC}"
    exit 1
fi

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}❌ Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Database connection details
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

echo -e "${YELLOW}🔄 Starting database restore from: $BACKUP_FILE${NC}"

# If file is gzipped, uncompress it to a temporary file
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${YELLOW}📦 Uncompressing backup file...${NC}"
    TEMP_FILE="/tmp/db_restore_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# Drop all connections except ours
echo -e "${YELLOW}🔄 Disconnecting other clients...${NC}"
psql "$DB_URL" << EOF
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE pid <> pg_backend_pid() 
AND datname = 'postgres';
EOF

# Restore the database
echo -e "${YELLOW}📥 Restoring database...${NC}"
if psql "$DB_URL" < "$BACKUP_FILE"; then
    echo -e "${GREEN}✅ Database restored successfully!${NC}"
else
    echo -e "${RED}❌ Database restore failed!${NC}"
    exit 1
fi

# Clean up temporary file if it was created
if [[ "$BACKUP_FILE" == /tmp/db_restore_* ]]; then
    rm "$BACKUP_FILE"
fi

# Verify the restore
echo -e "${YELLOW}🔍 Verifying database restore...${NC}"
COMPANY_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM companies;")
EMPLOYEE_COUNT=$(psql "$DB_URL" -t -c "SELECT COUNT(*) FROM employees;")

echo -e "${GREEN}📊 Database Status:${NC}"
echo -e "Companies: $COMPANY_COUNT"
echo -e "Employees: $EMPLOYEE_COUNT" 