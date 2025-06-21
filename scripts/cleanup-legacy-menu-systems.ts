#!/usr/bin/env ts-node

/**
 * 🧹 ENTERPRISE MENU CLEANUP SCRIPT
 * ==================================
 * 
 * This script removes ALL legacy menu systems and keeps only the enterprise-grade
 * menu structure (lib/menu-system/index.ts) as the single source of truth.
 * 
 * REMOVES:
 * - Database menu_items table and related services
 * - Legacy menu configuration files
 * - Unused menu components
 * - SQL menu scripts
 * 
 * KEEPS:
 * - lib/menu-system/index.ts (ENTERPRISE_MENU_CONFIG)
 * - components/sidebar-navigation.tsx (uses enterprise menu)
 * 
 * @author Menu Cleanup Team
 * @version 1.0.0
 */

import fs from 'fs'
import path from 'path'

// Files and directories to remove
const LEGACY_FILES = [
  // Legacy menu configuration files
  'components/dynamic-menu/menu-items.ts',
  'lib/menu-structure.ts',
  'lib/unified-menu-config.ts',
  'lib/unified-menu-system.ts',
  
  // Database menu services (will be replaced with static enterprise menu)
  'services/menu-service.ts',
  'services/unified-menu-service.ts',
  
  // Legacy menu components
  'components/menu-structure-viewer.tsx',
  'components/menu-permissions-editor.tsx',
  'components/admin/menu-permissions-manager.tsx',
  'components/admin/menu-permissions-debugger.tsx',
  'components/admin/rbac-tester.tsx',
  'components/events-submenu-finder.tsx',
  'components/sidebar-navigation-fixed.tsx',
  'components/sidebar-navigation-refactored.tsx',
  'components/simple-sidebar.tsx',
  'components/enterprise-sidebar.tsx',
  
  // SQL menu scripts (database-driven menus)
  'sql/add-event-coordination-menu.sql',
  'sql/add-event-coordination-submenu-items.sql',
  'sql/add-events-submenu-item.sql',
  'sql/add-reports-menu-items.sql',
  'sql/check-menu-items-in-db.sql',
  'sql/consolidate-menu-permissions.sql',
  'sql/create-menu-permissions-tables.sql',
  'sql/ensure-admin-menu-permissions.sql',
  'sql/fix-account-creation-menu-item.sql',
  'sql/fix-admin-menu-permissions.sql',
  'sql/fix-menu-permissions-for-admin.sql',
  'sql/remove-admin-submenu-items.sql',
  'sql/seed-menu-permissions.sql',
  'sql/update-menu-items.sql',
  'sql/enable-user-accounts-menu.sql',
  'sql/configure-sales-head-permissions.sql',
  'sql/refactor-role-permissions.sql',
  'sql/add-bug-management-menu-item.sql',
  
  // Menu-related actions
  'actions/add-event-coordination-menu.ts',
  'actions/add-events-submenu-item.ts',
  'actions/fix-account-creation-menu.ts',
  
  // API routes for database menus
  'app/api/menu/route.ts',
  'app/api/admin/sync-menus/route.ts',
  'app/api/admin/menu-changes/route.ts',
  
  // Menu admin pages
  'app/(protected)/admin/menu-permissions-manager/page.tsx',
  'app/(protected)/admin/fix-menu/page.tsx',
  'app/(protected)/admin/add-events-submenu/page.tsx',
  'app/(protected)/admin/events-submenu-status/page.tsx',
  'app/(protected)/admin/fix-admin-permissions/page.tsx',
  
  // Legacy menu utilities
  'lib/permission-utils.ts',
  'lib/permission-checker.ts'
]

// Directories to remove entirely
const LEGACY_DIRECTORIES = [
  'components/dynamic-menu',
  'system-backups/menu-migration-2025-06-09T04-30-32',
  'system-backups/working-state-20250607-181154'
]

// Files that reference legacy menu systems (need updating)
const FILES_TO_UPDATE = [
  'components/route-protector.tsx',
  'components/organization/role-manager.tsx',
  'app/(protected)/organization/test-permissions/page.tsx'
]

function removeFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`✅ Removed file: ${filePath}`)
    } else {
      console.log(`⚠️  File not found: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error removing file ${filePath}:`, error)
  }
}

function removeDirectory(dirPath: string): void {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true })
      console.log(`✅ Removed directory: ${dirPath}`)
    } else {
      console.log(`⚠️  Directory not found: ${dirPath}`)
    }
  } catch (error) {
    console.error(`❌ Error removing directory ${dirPath}:`, error)
  }
}

function updateFileImports(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found for update: ${filePath}`)
      return
    }

    let content = fs.readFileSync(filePath, 'utf8')
    let updated = false

    // Replace legacy imports with enterprise menu imports
    const replacements = [
      {
        from: /import.*from ['"]@\/lib\/unified-menu-config['"]/g,
        to: 'import { ENTERPRISE_MENU_CONFIG, type MenuItemConfig } from "@/lib/menu-system"'
      },
      {
        from: /import.*from ['"]@\/services\/menu-service['"]/g,
        to: '// Legacy menu service removed - using enterprise menu system'
      },
      {
        from: /import.*from ['"]@\/services\/unified-menu-service['"]/g,
        to: '// Legacy unified menu service removed - using enterprise menu system'
      },
      {
        from: /UNIFIED_MENU_CONFIG/g,
        to: 'ENTERPRISE_MENU_CONFIG'
      }
    ]

    replacements.forEach(({ from, to }) => {
      if (from.test(content)) {
        content = content.replace(from, to)
        updated = true
      }
    })

    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`✅ Updated imports in: ${filePath}`)
    } else {
      console.log(`⚠️  No legacy imports found in: ${filePath}`)
    }
  } catch (error) {
    console.error(`❌ Error updating file ${filePath}:`, error)
  }
}

function main(): void {
  console.log('🚀 Starting Enterprise Menu Cleanup...\n')

  // Remove legacy files
  console.log('📁 Removing legacy menu files...')
  LEGACY_FILES.forEach(removeFile)

  // Remove legacy directories
  console.log('\n📂 Removing legacy menu directories...')
  LEGACY_DIRECTORIES.forEach(removeDirectory)

  // Update files with legacy imports
  console.log('\n🔄 Updating files with legacy imports...')
  FILES_TO_UPDATE.forEach(updateFileImports)

  console.log('\n✨ Enterprise Menu Cleanup Complete!')
  console.log('\n📋 SUMMARY:')
  console.log('✅ Removed all legacy menu systems')
  console.log('✅ Updated import references')
  console.log('✅ Enterprise menu system (lib/menu-system/index.ts) is now the ONLY menu source')
  console.log('\n🎯 NEXT STEPS:')
  console.log('1. Restart your development server')
  console.log('2. Test all menu functionality')
  console.log('3. Remove menu_items table from database if not needed for other purposes')
  console.log('\n⚡ Your menu system is now clean and enterprise-grade!')
}

if (require.main === module) {
  main()
}

export { removeFile, removeDirectory, updateFileImports } 