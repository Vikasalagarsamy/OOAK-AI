// 🚨 MIGRATED FROM SUPABASE TO POSTGRESQL
// Migration Date: 2025-06-20T09:40:16.375Z
// Original file backed up as: fix-processing-records.js.backup


// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DATABASE || 'ooak_future',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'password',
  ssl: process.env.POSTGRES_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});


// Query helper function
async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return { data: result.rows, error: null };
  } catch (error) {
    console.error('❌ PostgreSQL Query Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Transaction helper function  
async function transaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return { data: result, error: null };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ PostgreSQL Transaction Error:', error.message);
    return { data: null, error: error.message };
  } finally {
    client.release();
  }
}

// Original content starts here:
const { Pool } = require('pg');
import { spawn } from 'child_process';
import { promisify } from 'util';

// PostgreSQL connection - see pool configuration below

async function runPythonScript(audioPath, model = 'large-v3') {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [
      'scripts/faster-whisper-translate.py',
      audioPath,
      model
    ], {
      cwd: process.cwd(),
      env: { ...process.env, PATH: process.env.PATH + ':/Users/vikasalagarsamy/IMPORTANT/whisper-env/bin' }
    });

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python script failed: ${errorOutput}`));
        return;
      }

      try {
        // Extract JSON from output
        const lines = output.split('\n');
        const jsonStartIndex = lines.findIndex(line => line.includes('JSON Output:'));
        
        if (jsonStartIndex === -1) {
          reject(new Error('No JSON output found'));
          return;
        }

        const jsonLines = lines.slice(jsonStartIndex + 1);
        const jsonString = jsonLines.join('\n').trim();
        const result = JSON.parse(jsonString);
        
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse JSON: ${error.message}`));
      }
    });
  });
}

async function fixProcessingRecords() {
  try {
    console.log('🔧 Fixing processing records...');
    
    // Get all records that are still processing
    const { data: processingRecords, error } = await supabase
      .from('call_transcriptions')
      .select('*')
      .like('transcript', '%Processing%');
    
    if (error) throw error;
    
    console.log(`📋 Found ${processingRecords.length} records still processing`);
    
    for (const record of processingRecords) {
      console.log(`\n🎯 Processing: ${record.client_name} (${record.call_id})`);
      
      if (!record.recording_url) {
        console.log('   ⚠️  No recording URL, skipping...');
        continue;
      }
      
      try {
        console.log(`   🔄 Running Large-v3 translation...`);
        const translationResult = await runPythonScript(record.recording_url, 'large-v3');
        
        if (!translationResult.success) {
          console.log(`   ❌ Translation failed: ${translationResult.error || 'Unknown error'}`);
          continue;
        }
        
        console.log(`   ✅ Translation completed!`);
        console.log(`   📍 Language: ${translationResult.detected_language} (${(translationResult.language_confidence * 100).toFixed(1)}% confidence)`);
        console.log(`   ⏱️  Duration: ${translationResult.duration.toFixed(1)} seconds`);
        console.log(`   📝 Translation: ${translationResult.english_translation.substring(0, 100)}...`);
        
        // Update database record
        const { error: updateError } = await supabase
          .from('call_transcriptions')
          .update({
            transcript: translationResult.english_translation,
            confidence_score: translationResult.language_confidence,
            duration: Math.round(translationResult.duration),
            detected_language: translationResult.detected_language,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id);
        
        if (updateError) {
          console.log(`   ❌ Database update failed: ${updateError.message}`);
        } else {
          console.log(`   ✅ Database updated successfully!`);
        }
        
      } catch (error) {
        console.log(`   ❌ Error processing ${record.client_name}: ${error.message}`);
      }
    }
    
    console.log('\n🎉 Processing complete! Refreshing browser should show updated transcripts.');
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

fixProcessingRecords(); 