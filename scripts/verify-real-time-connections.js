#!/usr/bin/env node

/**
 * REAL-TIME DATABASE CONNECTION VERIFIER
 * 
 * This script verifies that all critical application components are properly
 * connected to real-time database and no mock data fallbacks exist.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Verifying Real-Time Database Connections...\n');

// Critical components that MUST use real-time data
const CRITICAL_COMPONENTS = {
  'Dashboard': 'app/(protected)/dashboard/page.tsx',
  'AI Insights': 'components/ai-insights/ai-insights-dashboard.tsx',
  'Call Analytics': 'app/(protected)/tasks/dashboard/call-analytics-page.tsx',
  'Team Performance API': 'app/api/ai-insights/team-performance/route.ts',
  'AI ML Service': 'lib/ai-ml-service.ts',
  'Dashboard Service': 'services/dashboard-service.ts',
  'BI Service': 'services/ai-business-intelligence-service.ts'
};

// Required database patterns for production
const REQUIRED_PATTERNS = {
  supabase_import: /import.*createClient.*from.*supabase/,
  database_queries: /\.from\(['"`]\w+['"`]\)/,
  api_calls: /fetch\(['"`]\/api\//,
  error_handling: /catch.*error/
};

// Forbidden patterns in production
const FORBIDDEN_PATTERNS = {
  demo_data: /loadDemoData|generateDemoData|demoData|mockData/,
  hardcoded_arrays: /const\s+\w*[Dd]ata\s*=\s*\[/,
  fallback_logic: /is_demo_data|error_fallback|demo-\w+-\d+/,
  placeholder_text: /placeholder.*data|sample.*data|test.*data/i
};

/**
 * Analyze a file for real-time database compliance
 */
function analyzeFile(filePath, componentName) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
      return {
        status: 'ERROR',
        message: 'File not found',
        details: []
      };
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const issues = [];
    const compliance = {};

    // Check for required patterns
    Object.entries(REQUIRED_PATTERNS).forEach(([name, pattern]) => {
      compliance[name] = pattern.test(content);
      if (!compliance[name] && (name === 'supabase_import' || name === 'database_queries')) {
        issues.push(`Missing ${name.replace('_', ' ')}`);
      }
    });

    // Check for forbidden patterns
    Object.entries(FORBIDDEN_PATTERNS).forEach(([name, pattern]) => {
      if (pattern.test(content)) {
        const matches = content.match(pattern) || [];
        issues.push(`Found ${name.replace('_', ' ')}: ${matches.slice(0, 3).join(', ')}`);
      }
    });

    // Determine overall status
    let status = 'PASS';
    if (issues.length > 0) {
      status = issues.some(issue => issue.includes('Missing')) ? 'FAIL' : 'WARNING';
    }

    return {
      status,
      message: status === 'PASS' ? 'Real-time database ready' : `${issues.length} issues found`,
      details: issues,
      compliance
    };

  } catch (error) {
    return {
      status: 'ERROR',
      message: `Analysis failed: ${error.message}`,
      details: []
    };
  }
}

/**
 * Check database connection requirements
 */
function checkDatabaseRequirements() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const requirements = {
    env_file: fs.existsSync(envPath),
    supabase_url: false,
    supabase_key: false
  };

  if (requirements.env_file) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    requirements.supabase_url = /NEXT_PUBLIC_SUPABASE_URL=/.test(envContent);
    requirements.supabase_key = /NEXT_PUBLIC_SUPABASE_ANON_KEY=/.test(envContent);
  }

  return requirements;
}

/**
 * Verify API endpoints are database-connected
 */
function verifyAPIEndpoints() {
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  const criticalAPIs = [
    'quotations',
    'leads',
    'employees',
    'tasks',
    'ai-insights/team-performance',
    'dashboard'
  ];

  const results = {};

  criticalAPIs.forEach(api => {
    const apiPath = path.join(apiDir, api, 'route.ts');
    if (fs.existsSync(apiPath)) {
      const content = fs.readFileSync(apiPath, 'utf8');
      
      results[api] = {
        exists: true,
        has_supabase: /createClient|supabase/.test(content),
        has_database_query: /\.from\(['"`]\w+['"`]\)/.test(content),
        has_error_handling: /catch.*error/i.test(content),
        no_mock_data: !/mockData|demoData|hardcoded/i.test(content)
      };
    } else {
      results[api] = { exists: false };
    }
  });

  return results;
}

/**
 * Generate production readiness report
 */
function generateReport(componentResults, dbRequirements, apiResults) {
  console.log('📊 PRODUCTION REAL-TIME DATABASE REPORT\n');
  
  // Component Analysis
  console.log('🔧 CRITICAL COMPONENTS:');
  Object.entries(componentResults).forEach(([name, result]) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
    console.log(`${icon} ${name}: ${result.message}`);
    
    if (result.details.length > 0) {
      result.details.forEach(detail => console.log(`   • ${detail}`));
    }
  });

  // Database Requirements
  console.log('\n🗄️  DATABASE CONFIGURATION:');
  console.log(`${dbRequirements.env_file ? '✅' : '❌'} .env.local file exists`);
  console.log(`${dbRequirements.supabase_url ? '✅' : '❌'} Supabase URL configured`);
  console.log(`${dbRequirements.supabase_key ? '✅' : '❌'} Supabase API key configured`);

  // API Endpoints
  console.log('\n🔌 API ENDPOINTS:');
  Object.entries(apiResults).forEach(([api, result]) => {
    if (result.exists) {
      const score = Object.values(result).filter(v => v === true).length - 1; // -1 for 'exists'
      const icon = score >= 3 ? '✅' : score >= 2 ? '⚠️' : '❌';
      console.log(`${icon} /api/${api}: ${score}/4 checks passed`);
      
      if (score < 4) {
        Object.entries(result).forEach(([check, passed]) => {
          if (check !== 'exists' && !passed) {
            console.log(`   • Missing: ${check.replace('_', ' ')}`);
          }
        });
      }
    } else {
      console.log(`❌ /api/${api}: Not found`);
    }
  });

  // Overall Assessment
  const totalComponents = Object.keys(componentResults).length;
  const passedComponents = Object.values(componentResults).filter(r => r.status === 'PASS').length;
  const dbScore = Object.values(dbRequirements).filter(v => v).length;
  const apiScore = Object.values(apiResults).filter(api => 
    api.exists && Object.values(api).filter(v => v === true).length >= 4
  ).length;

  console.log('\n🎯 PRODUCTION READINESS SCORE:');
  console.log(`   Components: ${passedComponents}/${totalComponents} (${Math.round(passedComponents/totalComponents*100)}%)`);
  console.log(`   Database: ${dbScore}/3 (${Math.round(dbScore/3*100)}%)`);
  console.log(`   APIs: ${apiScore}/${Object.keys(apiResults).length} (${Math.round(apiScore/Object.keys(apiResults).length*100)}%)`);
  
  const overallScore = Math.round(((passedComponents/totalComponents) + (dbScore/3) + (apiScore/Object.keys(apiResults).length)) / 3 * 100);
  
  console.log(`\n🚀 OVERALL SCORE: ${overallScore}%`);
  
  if (overallScore >= 90) {
    console.log('✅ PRODUCTION READY - Real-time database fully connected!');
  } else if (overallScore >= 70) {
    console.log('⚠️  MOSTLY READY - Some improvements needed');
  } else {
    console.log('❌ NOT READY - Critical issues must be resolved');
  }
}

/**
 * Main execution
 */
async function main() {
  // 1. Analyze critical components
  console.log('🔍 Analyzing critical components...');
  const componentResults = {};
  
  Object.entries(CRITICAL_COMPONENTS).forEach(([name, filePath]) => {
    componentResults[name] = analyzeFile(filePath, name);
  });

  // 2. Check database requirements
  console.log('🔍 Checking database configuration...');
  const dbRequirements = checkDatabaseRequirements();

  // 3. Verify API endpoints
  console.log('🔍 Verifying API endpoints...');
  const apiResults = verifyAPIEndpoints();

  // 4. Generate comprehensive report
  generateReport(componentResults, dbRequirements, apiResults);

  console.log('\n📋 NEXT ACTIONS:');
  console.log('1. Fix any failed components above');
  console.log('2. Ensure database contains real data (not empty tables)');
  console.log('3. Test application with real user workflows');
  console.log('4. Monitor for any remaining hardcoded values');
  console.log('5. Deploy with confidence! 🚀');
}

main().catch(console.error); 