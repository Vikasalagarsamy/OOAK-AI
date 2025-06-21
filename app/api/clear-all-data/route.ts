import { query, transaction } from '@/lib/postgresql-client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🗑️ [CLEAR ALL DATA] Starting to clear all data via PostgreSQL...');
    
    // Use transaction for data integrity
    await transaction(async (client) => {
      // Clear tasks first (might have foreign key dependencies)
      console.log('Clearing tasks...');
      await client.query('DELETE FROM tasks WHERE id > 0');
      console.log('✅ Tasks cleared successfully');

      // Clear quotations
      console.log('Clearing quotations...');
      await client.query('DELETE FROM quotations WHERE id > 0');
      console.log('✅ Quotations cleared successfully');

      // Clear leads
      console.log('Clearing leads...');
      await client.query('DELETE FROM leads WHERE id > 0');
      console.log('✅ Leads cleared successfully');
    });

    // Verify clearing by counting records
    const [tasksResult, quotationsResult, leadsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM tasks'),
      query('SELECT COUNT(*) as count FROM quotations'),
      query('SELECT COUNT(*) as count FROM leads')
    ]);

    const results = {
      success: true,
      message: 'All data cleared successfully via PostgreSQL',
      remainingCounts: {
        tasks: parseInt(tasksResult.rows[0]?.count || '0'),
        quotations: parseInt(quotationsResult.rows[0]?.count || '0'),
        leads: parseInt(leadsResult.rows[0]?.count || '0')
      },
      timestamp: new Date().toISOString()
    };

    console.log('🎯 [CLEAR ALL DATA] Clear operation completed via PostgreSQL:', results);
    
    return NextResponse.json(results);
    
  } catch (error) {
    console.error('❌ Failed to clear data (PostgreSQL):', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to clear data', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 