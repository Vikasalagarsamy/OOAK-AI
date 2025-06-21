#!/bin/bash

# Automatic Database Backup System
# This script creates regular backups of the database

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory if it doesn't exist
BACKUP_DIR="$HOME/db_backups"
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql"

echo -e "${YELLOW}📦 Creating database backup...${NC}"

# Get database connection details from Supabase config
DB_URL="postgresql://postgres:postgres@localhost:54322/postgres"

# Create backup
pg_dump "$DB_URL" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    # Compress the backup
    gzip "$BACKUP_FILE"
    
    # Make backup read-only
    chmod 400 "$BACKUP_FILE.gz"
    
    echo -e "${GREEN}✅ Backup created successfully: $BACKUP_FILE.gz${NC}"
    
    # Clean up old backups (keep last 7 days)
    find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -mtime +7 -delete
    
    # Create symlink to latest backup
    ln -sf "$BACKUP_FILE.gz" "$BACKUP_DIR/latest_backup.sql.gz"
else
    echo -e "${RED}❌ Backup failed!${NC}"
    exit 1
fi

# Display backup info
echo -e "${GREEN}📊 Backup Summary:${NC}"
echo -e "Location: $BACKUP_FILE.gz"
echo -e "Size: $(du -h "$BACKUP_FILE.gz" | cut -f1)"
echo -e "Timestamp: $TIMESTAMP" 