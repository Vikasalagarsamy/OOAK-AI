#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to fix - all the ones with hardcoded PostgreSQL connections
const filesToFix = [
  'app/api/payment-received/route.ts',
  'app/api/notifications/debug/route.ts',
  'app/api/notifications/enhanced/route.ts',
  'app/api/notifications/route.ts',
  'app/api/notifications/mark-all-read/route.ts',
  'app/api/notifications/[id]/read/route.ts',
  'app/api/employees/route.ts',
  'app/api/reports/lead-sources/route.ts',
  'app/api/user-accounts/route.ts',
  'app/api/quotation-details/route.ts',
  'app/api/services/route.ts',
  'app/api/quotation-continuous-workflow/route.ts',
  'app/api/whatsapp/send/route.ts',
  'app/api/call-uploads/route.ts',
  'app/api/tasks-direct/route.ts',
  'app/api/call-recordings/route.ts',
  'app/api/performance/route.ts',
  'app/api/call-analytics/debug/route.ts',
  'app/api/call-recordings-simple/route.ts',
  'app/api/ai-universal-chat/route.ts',
  'app/api/webhooks/email/route.ts',
  'app/api/webhooks/local-calls-simple/route.ts',
  'app/api/webhooks/calls/route.ts',
  'app/api/webhooks/whatsapp/route.ts',
  'app/api/webhooks/update-transcript/route.ts',
  'app/api/webhooks/instagram/route.ts',
  'app/api/webhooks/local-calls-simple-upload/route.ts',
  'app/api/leads/analytics/route.ts',
  'app/api/leads/route.ts',
  'app/api/mobile-auth/route.ts',
  'app/api/quotations/route.ts',
  'app/api/employee-auth/route.ts',
  'app/api/leads/update/route.ts',
  'app/api/quotations/[id]/status/route.ts',
  'app/api/tasks-simple/route.ts',
  'app/api/quotations-simple/route.ts',
  'app/api/people/batch/route.ts',
  'app/api/quotation-edit-approval/route.ts',
  'app/api/call-status/route.ts',
  'app/api/enhanced-menu/route.ts',
  'app/api/test-call-recordings/route.ts',
  'app/api/deliverables/route.ts',
  'app/api/dashboard/route.ts',
  'app/api/ai-tasks/generate/route.ts',
  'app/api/business-intelligence/setup/route.ts',
  'app/api/dashboard/verify-data/route.ts',
  'app/api/business-intelligence/test-data/route.ts',
  'app/api/ai-simple-chat/route.ts',
  'app/api/role-permissions/route.ts',
  'app/api/departments/route.ts',
  'app/api/roles/route.ts',
  'app/api/admin/database-status/route.ts',
  'app/api/admin/create-tables/route.ts',
  'app/api/admin/setup-quotation-tables/route.ts',
  'app/api/admin/integration-test/route.ts',
  'app/api/roles/[id]/route.ts',
  'app/api/admin/menu-permissions/route.ts',
  'app/api/admin/check-table-columns/route.ts',
  'app/api/admin/menu-permissions/bulk/route.ts',
  'app/api/admin/execute-sql/route.ts',
  'app/api/employee-registration/route.ts',
  'app/api/create-sample-data/route.ts',
  'app/api/designations/route.ts',
  'app/api/menu-items/route.ts',
  'app/api/health/database/route.ts',
  'app/api/trigger-call/route.ts',
  'app/api/setup-sample-data/route.ts',
  'app/api/tasks/route.ts',
  'app/api/setup-whatsapp-table/route.ts',
  'app/api/auth/menu-permissions/route.ts',
  'app/api/auth/test-roles/route.ts',
  'app/api/test-db-connection/route.ts',
  'app/api/call-monitoring/route.ts',
  'app/api/quotation-approval/route.ts',
  'app/api/fix-employee-departments/route.ts',
  'app/api/sales/batch/route.ts',
  'app/api/test/realtime-system/route.ts',
  'app/api/test/business-notifications/route.ts',
  'app/api/test/create-notification/route.ts',
  'app/api/test/trigger-realtime/route.ts',
  'app/api/ai-insights/team-performance/route.ts',
  'app/api/ai-insights/forecasts/route.ts',
  'app/api/ai-insights/notifications/route.ts',
  'app/api/test-connection/route.ts',
  'app/api/call-upload/route.ts',
  'app/api/ai-business-intelligence/route.ts',
  'app/api/customer-ai-chat/route.ts',
  'app/api/debug-team-performance/route.ts',
  'app/api/test-notifications/route.ts',
  'app/api/quotations-list/route.ts',
  'app/api/organization/batch/route.ts',
  'actions/user-accounts-actions.ts',
  'actions/enhanced-account-creation-actions.ts',
  'lib/menu-permissions-service.ts'
];

let totalFixed = 0;
let totalFiles = 0;

console.log('🔧 Starting bulk database connection fix...\n');

for (const filePath of filesToFix) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    continue;
  }
  
  try {
    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;
    totalFiles++;
    
    // Check if file already uses the correct import
    if (content.includes("import { pool } from '@/lib/postgresql-client'") || 
        content.includes("import { query } from '@/lib/postgresql-client'")) {
      console.log(`✅ ${filePath} - Already using centralized client`);
      continue;
    }
    
    // Replace hardcoded Pool imports
    if (content.includes("import { Pool } from 'pg'")) {
      content = content.replace(
        /import { Pool } from 'pg'/g,
        "import { pool } from '@/lib/postgresql-client'"
      );
      modified = true;
    }
    
    // Replace hardcoded pool configurations
    const poolConfigRegex = /const pool = new Pool\(\{[\s\S]*?\}\)/g;
    if (poolConfigRegex.test(content)) {
      content = content.replace(poolConfigRegex, '// Using centralized PostgreSQL client');
      modified = true;
    }
    
    // Replace pool variable declarations
    const poolVarRegex = /const pool = new Pool\(\{[^}]*user: 'postgres'[^}]*\}\)/g;
    if (poolVarRegex.test(content)) {
      content = content.replace(poolVarRegex, '// Using centralized PostgreSQL client');
      modified = true;
    }
    
    // Replace individual hardcoded configurations
    content = content.replace(/user: 'postgres',?/g, '');
    content = content.replace(/database: 'postgres',?/g, '');
    content = content.replace(/port: 54322,?/g, '');
    content = content.replace(/host: 'localhost',?/g, '');
    content = content.replace(/password: '',?/g, '');
    
    // Clean up empty Pool configurations
    content = content.replace(/new Pool\(\{\s*\}\)/g, 'pool');
    
    if (modified) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ ${filePath} - Fixed database connection`);
      totalFixed++;
    } else {
      console.log(`ℹ️  ${filePath} - No changes needed`);
    }
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

console.log(`\n🎉 Bulk fix completed!`);
console.log(`📊 Summary:`);
console.log(`   - Files processed: ${totalFiles}`);
console.log(`   - Files fixed: ${totalFixed}`);
console.log(`   - Files skipped: ${totalFiles - totalFixed}`);
console.log(`\n✅ All API routes should now use the centralized PostgreSQL client!`); 