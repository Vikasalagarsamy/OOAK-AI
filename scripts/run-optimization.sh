#!/bin/bash

# 🚀 Supabase Optimization Runner
# This script connects to your Supabase database and runs the optimization

echo "🚀 Running Production Optimization on Supabase..."

# Your Supabase connection details
SUPABASE_HOST="db.aavofqdzjhyfjygkxynq.supabase.co"
SUPABASE_PORT="5432"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"

echo "🔗 Connecting to: $SUPABASE_HOST"
echo "📊 Running optimization script..."

# Run the optimization script
psql "postgresql://$SUPABASE_USER:$SUPABASE_PASSWORD@$SUPABASE_HOST:$SUPABASE_PORT/$SUPABASE_DB" \
  -f scripts/production-optimization-quick.sql

if [ $? -eq 0 ]; then
    echo "✅ Optimization completed successfully!"
    echo "🎉 Your notification system is now production-ready!"
else
    echo "❌ Optimization failed. Check the error messages above."
    echo "💡 Try using the Supabase SQL Editor instead:"
    echo "   https://aavofqdzjhyfjygkxynq.supabase.co/project/aavofqdzjhyfjygkxynq/sql/new"
fi 