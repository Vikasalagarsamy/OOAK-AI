#!/bin/bash

# 🚀 Supabase Local Development Manager
echo "🚀 Supabase Local Development Manager"
echo "====================================="

case "$1" in
    "start")
        echo "🚀 Starting Supabase local development..."
        supabase start
        echo ""
        echo "✅ Supabase is now running!"
        echo "📊 Studio: http://127.0.0.1:54323"
        echo "🗄️  Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        ;;
    
    "stop")
        echo "🛑 Stopping Supabase local development..."
        supabase stop
        echo "✅ Supabase stopped"
        ;;
    
    "status")
        echo "📋 Supabase Status:"
        supabase status
        ;;
    
    "studio")
        echo "🎯 Opening Supabase Studio..."
        open http://127.0.0.1:54323
        ;;
    
    "logs")
        echo "📝 Supabase Logs:"
        supabase logs
        ;;
    
    "reset")
        echo "⚠️  Resetting local database..."
        read -p "Are you sure? This will delete all local data! [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            supabase db reset
            echo "✅ Database reset complete"
        else
            echo "❌ Reset cancelled"
        fi
        ;;
    
    "import-schema")
        echo "📥 Manual schema import instructions:"
        echo ""
        echo "1. Go to your remote Supabase Dashboard"
        echo "2. Open SQL Editor"
        echo "3. Run: SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"
        echo "4. Copy the table list"
        echo "5. For each table, run: SHOW CREATE TABLE table_name; (or similar)"
        echo "6. Copy the CREATE statements to your local Studio SQL Editor"
        echo ""
        echo "🎯 Local Studio: http://127.0.0.1:54323"
        ;;
    
    "import-data")
        echo "📊 Manual data import instructions:"
        echo ""
        echo "1. In your remote Supabase SQL Editor, run:"
        echo "   SELECT * FROM your_table_name LIMIT 100;"
        echo "2. Copy the results"
        echo "3. Use the data to create INSERT statements"
        echo "4. Run those INSERT statements in your local Studio"
        echo ""
        echo "🎯 Local Studio: http://127.0.0.1:54323"
        ;;
    
    *)
        echo "Usage: ./supabase-local.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start        - Start Supabase local development"
        echo "  stop         - Stop Supabase local development"
        echo "  status       - Show status of all services"
        echo "  studio       - Open Supabase Studio in browser"
        echo "  logs         - Show service logs"
        echo "  reset        - Reset local database (deletes all data)"
        echo "  import-schema- Instructions for importing schema"
        echo "  import-data  - Instructions for importing data"
        echo ""
        echo "🎯 Quick access:"
        echo "  Studio: http://127.0.0.1:54323"
        echo "  Database: postgresql://postgres:postgres@127.0.0.1:54322/postgres"
        ;;
esac 