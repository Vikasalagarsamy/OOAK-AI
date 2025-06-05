#!/bin/bash

# 🚀 Concurrent Index Creation Script
# This script creates indexes one by one to avoid transaction block issues

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Database connection info (modify as needed)
DB_NAME="${DB_NAME:-your_database_name}"
DB_USER="${DB_USER:-your_username}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Function to execute SQL and handle errors
execute_sql() {
    local sql="$1"
    local description="$2"
    
    echo -e "${BLUE}Creating: ${description}${NC}"
    
    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "$sql"; then
        echo -e "${GREEN}✅ Success: ${description}${NC}"
    else
        echo -e "${RED}❌ Failed: ${description}${NC}"
        echo -e "${YELLOW}Note: Index might already exist or table might not exist yet${NC}"
    fi
    
    echo "---"
    sleep 1  # Brief pause between operations
}

echo -e "${GREEN}🚀 Starting Concurrent Index Creation${NC}"
echo -e "${YELLOW}Database: $DB_NAME@$DB_HOST:$DB_PORT${NC}"
echo "================================="

# NOTIFICATION SYSTEM INDEXES
echo -e "${BLUE}📊 Creating Notification System Indexes...${NC}"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;" "Unread notifications index"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_created_at_desc ON notifications(created_at DESC);" "Notifications by creation date"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_priority_created ON notifications(priority, created_at DESC);" "Notifications by priority and date"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_type_user ON notifications(type, user_id);" "Notifications by type and user"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_metadata_business ON notifications USING GIN(metadata) WHERE metadata->>'business_event' = 'true';" "Business notifications metadata index"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_composite ON notifications(user_id, is_read, created_at DESC);" "Composite notifications index"

# QUOTATION SYSTEM INDEXES
echo -e "${BLUE}📋 Creating Quotation System Indexes...${NC}"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_status_created_at ON quotations(status, created_at DESC);" "Quotations by status and date"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_workflow_status ON quotations(workflow_status) WHERE workflow_status IS NOT NULL;" "Quotations workflow status"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_created_by_status ON quotations(created_by, status);" "Quotations by creator and status"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotations_total_amount ON quotations(total_amount) WHERE total_amount > 0;" "Quotations by amount"

# QUOTATION EVENTS INDEXES
echo -e "${BLUE}📅 Creating Quotation Events Indexes...${NC}"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_date_range ON quotation_events(event_date) WHERE event_date >= CURRENT_DATE;" "Upcoming events index"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_quotation_events_quotation_date ON quotation_events(quotation_id, event_date);" "Events by quotation and date"

# PERFORMANCE METRICS INDEXES
echo -e "${BLUE}📈 Creating Performance Metrics Indexes...${NC}"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_period_employee ON sales_performance_metrics(metric_period DESC, employee_id);" "Performance by period and employee"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_performance_score ON sales_performance_metrics(performance_score DESC) WHERE performance_score IS NOT NULL;" "Performance scores index"

# EMPLOYEE INDEXES
echo -e "${BLUE}👥 Creating Employee Indexes...${NC}"

execute_sql "CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_employees_role_active ON employees(role) WHERE is_active = true;" "Active employees by role"

echo "================================="
echo -e "${GREEN}🎉 Index creation process completed!${NC}"
echo -e "${YELLOW}Note: Some indexes may have failed if tables don't exist yet - this is normal${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Check for any failed indexes above"
echo "2. Run ANALYZE on your tables to update statistics"
echo "3. Monitor query performance improvements"
echo ""
echo -e "${GREEN}Production optimization is now complete! 🚀${NC}" 