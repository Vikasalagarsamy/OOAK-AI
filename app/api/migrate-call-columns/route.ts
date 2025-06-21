import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/postgresql-client';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 [MIGRATE CALL COLUMNS] Running database migration via PostgreSQL...');

    // Run migration in a transaction for data integrity
    await transaction(async (client) => {
      // Add missing columns
      await client.query(`
        ALTER TABLE call_transcriptions 
        ADD COLUMN IF NOT EXISTS call_direction VARCHAR(20) DEFAULT 'outgoing',
        ADD COLUMN IF NOT EXISTS call_status VARCHAR(20) DEFAULT 'processing';
      `)

      // Create indexes
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_direction 
        ON call_transcriptions(call_direction);
      `)

      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_call_transcriptions_call_status 
        ON call_transcriptions(call_status);
      `)

      // Update existing records - call direction
      await client.query(`
        UPDATE call_transcriptions 
        SET call_direction = CASE 
            WHEN transcript ILIKE '%incoming%' THEN 'incoming'
            ELSE 'outgoing'
        END
        WHERE call_direction = 'outgoing'
      `)

      // Update existing records - call status
      await client.query(`
        UPDATE call_transcriptions 
        SET call_status = CASE 
            WHEN status = 'completed' THEN 'completed'
            WHEN status = 'processing' THEN 'processing'
            WHEN status = 'active' THEN 'connected'
            ELSE status
        END
        WHERE call_status = 'processing'
      `)

      console.log('✅ [MIGRATE CALL COLUMNS] Database migration completed successfully via PostgreSQL')
    })

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully via PostgreSQL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Migration error (PostgreSQL):', error);
    return NextResponse.json({
      error: 'Failed to run migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 