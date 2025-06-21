#!/bin/bash

# Complete Remote Database Export Script
echo "🚀 Starting complete remote database export..."

# Remote database connection details
REMOTE_HOST="aws-0-ap-south-1.pooler.supabase.com"
REMOTE_PORT="6543"
REMOTE_USER="postgres.aavofqdzjhyfjygkxynq"
REMOTE_DB="postgres"
REMOTE_PASSWORD="Vikass@2024"

# Export files
SCHEMA_FILE="remote-complete-schema.sql"
DATA_FILE="remote-complete-data.sql"
FULL_BACKUP="remote-complete-backup.sql"

echo "📋 Exporting complete database (schema + data)..."

# Complete backup with schema and data
PGPASSWORD="$REMOTE_PASSWORD" pg_dump \
  -h "$REMOTE_HOST" \
  -p "$REMOTE_PORT" \
  -U "$REMOTE_USER" \
  -d "$REMOTE_DB" \
  --verbose \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  > "$FULL_BACKUP"

if [ $? -eq 0 ]; then
  echo "✅ Complete backup exported to: $FULL_BACKUP"
  
  # Get file size
  FILE_SIZE=$(du -h "$FULL_BACKUP" | cut -f1)
  echo "📁 Backup file size: $FILE_SIZE"
  
  # Count tables in backup
  TABLE_COUNT=$(grep -c "CREATE TABLE" "$FULL_BACKUP")
  echo "📊 Tables found in backup: $TABLE_COUNT"
  
  if [ $TABLE_COUNT -ge 117 ]; then
    echo "🎉 SUCCESS: All tables exported!"
  else
    echo "⚠️  WARNING: Expected 117 tables, found $TABLE_COUNT"
  fi
  
else
  echo "❌ Export failed. Trying alternative method..."
  
  # Alternative: Schema only first
  echo "📋 Exporting schema only..."
  PGPASSWORD="$REMOTE_PASSWORD" pg_dump \
    -h "$REMOTE_HOST" \
    -p "$REMOTE_PORT" \
    -U "$REMOTE_USER" \
    -d "$REMOTE_DB" \
    --schema-only \
    --no-owner \
    --no-privileges \
    > "$SCHEMA_FILE"
  
  if [ $? -eq 0 ]; then
    echo "✅ Schema exported to: $SCHEMA_FILE"
    
    # Data only
    echo "📊 Exporting data only..."
    PGPASSWORD="$REMOTE_PASSWORD" pg_dump \
      -h "$REMOTE_HOST" \
      -p "$REMOTE_PORT" \
      -U "$REMOTE_USER" \
      -d "$REMOTE_DB" \
      --data-only \
      --no-owner \
      --no-privileges \
      > "$DATA_FILE"
    
    if [ $? -eq 0 ]; then
      echo "✅ Data exported to: $DATA_FILE"
      echo "📋 You now have complete backup in 2 files:"
      echo "   - Schema: $SCHEMA_FILE"
      echo "   - Data: $DATA_FILE"
    else
      echo "❌ Data export failed"
    fi
  else
    echo "❌ Schema export failed"
  fi
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Verify the exported files"
echo "2. Import to local database"
echo "3. Verify all 117 tables exist locally"
echo "4. ONLY THEN delete remote database" 