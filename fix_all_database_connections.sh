#!/bin/bash

echo "🚀 FIXING ALL DATABASE CONNECTIONS - MAXIMUM FOCUS!"

# Find all TypeScript files with the wrong port
files_with_54322=$(find app/api -name "*.ts" -exec grep -l "54322" {} \;)

for file in $files_with_54322; do
    echo "Fixing $file..."
    
    # Replace hardcoded Pool connections with postgresql-client import
    sed -i '' '1i\
import { query } from "@/lib/postgresql-client"
' "$file"
    
    # Remove the old Pool import and config
    sed -i '' '/import.*Pool.*from.*pg/d' "$file"
    sed -i '' '/const pool = new Pool({/,/})/d' "$file"
    
    # Replace pool.query with query
    sed -i '' 's/pool\.query/query/g' "$file"
    
    # Replace client.query with query (for cases with pool.connect)
    sed -i '' 's/client\.query/query/g' "$file"
    
    # Remove pool connection management
    sed -i '' '/const client = await pool\.connect()/d' "$file"
    sed -i '' '/await pool\.end()/d' "$file"
    sed -i '' '/client\.release()/d' "$file"
    
    echo "✅ Fixed $file"
done

echo "🎉 ALL DATABASE CONNECTIONS FIXED!"
