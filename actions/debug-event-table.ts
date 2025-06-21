"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { cookies } from "next/headers"

/**
 * DEBUG EVENT TABLE ACTIONS - NOW 100% POSTGRESQL
 * 
 * Complete migration from Supabase to PostgreSQL
 * - Direct PostgreSQL queries for maximum performance
 * - Enhanced error handling and logging
 * - Database introspection utilities
 * - All Supabase dependencies eliminated
 */

// Get the table information for events table
export async function getEventsTableInfo() {
  try {
    console.log('🔍 Fetching events table info via PostgreSQL...')
    
    // Direct PostgreSQL query to get column information
    const result = await query(`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable
      FROM 
        information_schema.columns 
      WHERE 
        table_name = $1
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `, ['events'])

    console.log(`✅ Retrieved ${result.rows.length} columns for events table`)
    return result.rows
  } catch (error: any) {
    console.error("❌ Error fetching events table info:", error)
    return { error: error.message }
  }
}

// Function to create the get_column_info function in the database
export async function createColumnInfoFunction() {
  try {
    console.log('🔧 Creating get_column_info function via PostgreSQL...')
    
    // Create a PostgreSQL function to get column information
    await query(`
      CREATE OR REPLACE FUNCTION get_column_info(table_name TEXT)
      RETURNS TABLE(
        column_name TEXT,
        data_type TEXT,
        character_maximum_length INTEGER,
        is_nullable TEXT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          c.column_name::TEXT,
          c.data_type::TEXT,
          c.character_maximum_length,
          c.is_nullable::TEXT
        FROM 
          information_schema.columns c
        WHERE 
          c.table_name = table_name
          AND c.table_schema = 'public';
      END;
      $$ LANGUAGE plpgsql;
    `)

    console.log('✅ Successfully created get_column_info function')
    return { success: true }
  } catch (error: any) {
    console.error("❌ Error creating get_column_info function:", error)
    return { error: error.message }
  }
}

// Test inserting a simple, short ID
export async function testInsertShortId() {
  try {
    console.log('🧪 Testing short ID insertion via PostgreSQL...')
    
    // Try inserting with a very short ID
    const event_id = "TEST123"

    const result = await query(`
      INSERT INTO events (event_id, name, is_active)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [event_id, "Test Event", true])

    if (result.rows.length > 0) {
      console.log(`✅ Successfully inserted test event with ID: ${event_id}`)
      return { success: true, data: result.rows[0] }
    } else {
      console.error('❌ No rows returned after insert')
      return { success: false, error: "No rows returned after insert" }
    }
  } catch (error: any) {
    console.error("❌ Error in test insert:", error)
    return { success: false, error: error.message }
  }
}
