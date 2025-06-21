#!/usr/bin/env node

/**
 * PostgreSQL Environment Analyzer
 * Analyzes current .env.local file and provides PostgreSQL migration recommendations
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 PostgreSQL Environment Analysis');
console.log('=====================================\n');

function analyzeEnvFile() {
    const envPath = '.env.local';
    
    if (!fs.existsSync(envPath)) {
        console.log('❌ .env.local file not found');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    let supabaseVars = [];
    let postgresVars = [];
    let deprecatedVars = [];
    let requiredPostgresVars = [
        'DATABASE_URL',
        'POSTGRES_HOST',
        'POSTGRES_PORT',
        'POSTGRES_DATABASE',
        'POSTGRES_USER',
        'POSTGRES_PASSWORD'
    ];
    
    let foundPostgresVars = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('#') || !trimmed.includes('=')) return;
        
        const [key] = trimmed.split('=');
        
        if (key.includes('SUPABASE')) {
            supabaseVars.push({ line: index + 1, key, value: trimmed });
        } else if (key.includes('POSTGRES') || key === 'DATABASE_URL') {
            postgresVars.push({ line: index + 1, key, value: trimmed });
            if (requiredPostgresVars.includes(key)) {
                foundPostgresVars.push(key);
            }
        }
    });
    
    console.log('📊 Current Environment Status:');
    console.log(`   Total lines: ${lines.length}`);
    console.log(`   Supabase variables: ${supabaseVars.length}`);
    console.log(`   PostgreSQL variables: ${postgresVars.length}\n`);
    
    if (supabaseVars.length > 0) {
        console.log('🟡 Found Supabase Variables:');
        supabaseVars.forEach(item => {
            console.log(`   Line ${item.line}: ${item.key}`);
        });
        console.log('');
    }
    
    console.log('✅ PostgreSQL Variables Found:');
    foundPostgresVars.forEach(key => {
        console.log(`   ✓ ${key}`);
    });
    
    const missingVars = requiredPostgresVars.filter(key => !foundPostgresVars.includes(key));
    if (missingVars.length > 0) {
        console.log('\n⚠️  Missing Required PostgreSQL Variables:');
        missingVars.forEach(key => {
            console.log(`   ✗ ${key}`);
        });
    }
    
    console.log('\n🚀 Recommendations:');
    
    if (supabaseVars.length > 0) {
        console.log('   1. Remove or comment out Supabase variables');
        console.log('   2. Run ./switch-to-postgresql-env.sh to clean up');
    }
    
    if (missingVars.length > 0) {
        console.log('   3. Add missing PostgreSQL variables');
    }
    
    if (supabaseVars.length === 0 && missingVars.length === 0) {
        console.log('   🎯 Environment is PostgreSQL-ready!');
        console.log('   ✅ All required PostgreSQL variables present');
        console.log('   ✅ No Supabase dependencies detected');
    }
    
    console.log('\n📋 Quick Setup Commands:');
    console.log('   # Switch to PostgreSQL environment:');
    console.log('   ./switch-to-postgresql-env.sh');
    console.log('');
    console.log('   # Verify PostgreSQL connection:');
    console.log('   node scripts/test-connection.cjs');
    console.log('');
    console.log('   # Create database if needed:');
    console.log('   createdb ooak_future');
}

analyzeEnvFile();
