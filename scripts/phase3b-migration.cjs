#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { migrateFileContent } = require('./phase2-js-migration.cjs');

console.log('🚀 Phase 3 Batch 2: Remaining Files Migration\n');

// Remaining files to migrate
const REMAINING_FILES = [
  'scripts/fix-quotation-assignment-simple.mjs',
  'scripts/fix-quotation-assignment.mjs', 
  'scripts/fix-quotation-totals.mjs',
  'scripts/fix-quotation-user-assignment.mjs',
  'scripts/test-quotation-ownership-fix.mjs',
  'scripts/run-quotation-workflow-setup.js',
  'archive-non-sales-tasks.js',
  'cleanup-ai-tasks-sales-only.js',
  'implement-clean-task-workflow.js',
  'fix-task-logic-correctly.js',
  'test-lead-to-task-automation.js',
  'scripts/run-workflow-migration.js',
  'fix-authentication-mapping.cjs',
  'fix-employee-mismatch.cjs',
  'fix-jothi-duplicates-completely.js',
  'debug-dashboard-api.cjs',
  'check-recent-calls.js',
  'monitor-whatsapp-live.js',
  'sales-task-summary.js',
  'IMPORTANT/scripts/check-lead-source-column.js',
  'scripts/check-lead-source-column.js',
  'scripts/complete-supabase-to-postgres-migration.cjs',
  'scripts/complete-supabase-to-postgres-migration.js',
  'OOAKCallManagerPro/OOAK-CRM-Integration-API.js'
];

async function migrateBatch2Files() {
  const results = { successful: [], failed: [], skipped: [] };

  for (const fileName of REMAINING_FILES) {
    try {
      const filePath = path.resolve(fileName);
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'File not found' });
        continue;
      }

      const originalContent = fs.readFileSync(filePath, 'utf8');
      
      if (originalContent.includes('MIGRATED FROM SUPABASE TO POSTGRESQL')) {
        console.log(`ℹ️  Already migrated: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'Already migrated' });
        continue;
      }

      if (!originalContent.includes('supabase') && !originalContent.includes('createClient')) {
        console.log(`ℹ️  No Supabase dependencies: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'No Supabase dependencies' });
        continue;
      }

      console.log(`🔄 Processing: ${fileName}`);
      const { content, hasChanges } = migrateFileContent(originalContent, fileName);

      if (hasChanges) {
        fs.writeFileSync(filePath + '.backup', originalContent);
        fs.writeFileSync(filePath, content);
        console.log(`✅ Migrated: ${fileName} (backup created)`);
        results.successful.push({ file: fileName, reason: 'Migrated successfully' });
      } else {
        console.log(`ℹ️  No changes needed: ${fileName}`);
        results.skipped.push({ file: fileName, reason: 'No changes needed' });
      }

    } catch (error) {
      console.error(`❌ Error migrating ${fileName}:`, error.message);
      results.failed.push({ file: fileName, reason: error.message });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎉 PHASE 3 BATCH 2 COMPLETE!');
  console.log('='.repeat(80));
  console.log(`✅ Successfully migrated: ${results.successful.length} files`);
  console.log(`⚠️  Skipped: ${results.skipped.length} files`);
  console.log(`❌ Failed: ${results.failed.length} files`);

  const totalMigrated = 12 + 31 + 24 + results.successful.length;
  console.log(`\n🏆 GRAND TOTAL: ${totalMigrated} files migrated`);
  console.log('🎯 Supabase to PostgreSQL migration complete!');

  return results;
}

if (require.main === module) {
  migrateBatch2Files().catch(console.error);
} 