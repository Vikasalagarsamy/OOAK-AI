import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/postgresql-client-unified';
import fs from 'fs/promises';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    console.log('🗃️ Creating speaker_corrections table...');

    // Read the SQL script
    const sqlPath = path.join(process.cwd(), 'scripts', 'create-speaker-corrections-table.sql');
    const sql = await fs.readFile(sqlPath, 'utf-8');

    // Execute the SQL
    const { data, error } = await query(`SELECT * FROM ${functionName}(${params})`);

    if (error) {
      // Try alternative approach
      console.log('⚠️ RPC method failed, trying direct SQL execution...');
      
      const { error: directError } = await supabase
        .from('speaker_corrections')
        .select('count')
        .limit(1);

      if (directError && directError.message.includes('does not exist')) {
        // Table doesn't exist, create it manually
        const createTableSQL = `
          CREATE TABLE IF NOT EXISTS speaker_corrections (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            call_id UUID NOT NULL,
            segment_id TEXT NOT NULL,
            text TEXT NOT NULL,
            suggested_speaker TEXT NOT NULL CHECK (suggested_speaker IN ('CLIENT', 'AGENT')),
            corrected_speaker TEXT NOT NULL CHECK (corrected_speaker IN ('CLIENT', 'AGENT')),
            confidence DECIMAL(3,2) DEFAULT 0.0,
            review_note TEXT DEFAULT '',
            reviewed_by TEXT DEFAULT 'sales_head',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `;

        // This won't work via supabase client, so we'll return instructions
        return NextResponse.json({
          success: false,
          message: 'Please create the table manually in Supabase dashboard',
          sql_to_execute: createTableSQL,
          instructions: [
            '1. Go to Supabase Dashboard',
            '2. Navigate to SQL Editor',
            '3. Execute the provided SQL',
            '4. Reload this page'
          ]
        });
      }
    }

    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('speaker_corrections')
      .select('count')
      .limit(1);

    if (testError) {
      throw new Error(`Table verification failed: ${testError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: 'speaker_corrections table is ready',
      table_status: 'exists_and_accessible'
    });

  } catch (error) {
    console.error('Table setup error:', error);
    return NextResponse.json({
      error: 'Failed to setup speaker_corrections table',
      details: error instanceof Error ? error.message : 'Unknown error',
      manual_sql: `
        CREATE TABLE IF NOT EXISTS speaker_corrections (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          call_id UUID NOT NULL,
          segment_id TEXT NOT NULL,
          text TEXT NOT NULL,
          suggested_speaker TEXT NOT NULL CHECK (suggested_speaker IN ('CLIENT', 'AGENT')),
          corrected_speaker TEXT NOT NULL CHECK (corrected_speaker IN ('CLIENT', 'AGENT')),
          confidence DECIMAL(3,2) DEFAULT 0.0,
          review_note TEXT DEFAULT '',
          reviewed_by TEXT DEFAULT 'sales_head',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    }, { status: 500 });
  }
} 