#!/bin/bash

echo "🚀 OOAK-FUTURE Development Environment Setup"
echo "============================================="
echo ""

# Function to check if PostgreSQL is running
check_postgresql() {
    if brew services list | grep postgresql | grep started >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# 1. Start PostgreSQL
echo "1️⃣ Starting PostgreSQL server..."
if check_postgresql; then
    echo "✅ PostgreSQL already running"
else
    echo "🔄 Starting PostgreSQL..."
    brew services start postgresql@15
    sleep 3
    if check_postgresql; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ Failed to start PostgreSQL"
        exit 1
    fi
fi

# 2. Create database
echo ""
echo "2️⃣ Creating database 'ooak_future'..."
if psql -h localhost -p 5432 -U postgres -d postgres -c "SELECT 1 FROM pg_database WHERE datname='ooak_future';" -t | grep -q 1 2>/dev/null; then
    echo "✅ Database 'ooak_future' already exists"
else
    echo "🔄 Creating database..."
    createdb -h localhost -p 5432 -U postgres ooak_future
    if [ $? -eq 0 ]; then
        echo "✅ Database 'ooak_future' created successfully"
    else
        echo "❌ Failed to create database"
        exit 1
    fi
fi

# 3. Remove Supabase dependency
echo ""
echo "3️⃣ Removing Supabase dependency from package.json..."
if grep -q '"@supabase/supabase-js"' package.json; then
    echo "🔄 Removing @supabase/supabase-js..."
    npm uninstall @supabase/supabase-js
    echo "✅ Supabase dependency removed"
else
    echo "✅ No Supabase dependency found"
fi

# 4. Test database connection
echo ""
echo "4️⃣ Testing database connection..."
if psql -h localhost -p 5432 -U postgres -d ooak_future -c "SELECT 'Connection successful!' as status;" 2>/dev/null; then
    echo "✅ Database connection successful!"
else
    echo "❌ Database connection failed"
    exit 1
fi

echo ""
echo "🎯 DEVELOPMENT ENVIRONMENT READY!"
echo "================================="
echo "✅ PostgreSQL server running"
echo "✅ Database 'ooak_future' available"
echo "✅ Supabase dependencies removed"
echo "✅ Database connection verified"
echo ""
echo "🚀 Ready to start development!"
echo "Run: npm run dev"

