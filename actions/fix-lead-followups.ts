"use server"

import { query } from "@/lib/postgresql-client"

export async function fixLeadFollowups(): Promise<{ success: boolean; message: string }> {
  try {
    console.log("🔧 [LEAD_FOLLOWUPS] Creating lead followup function via PostgreSQL...")

    // Create a comprehensive function to handle follow-up scheduling
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION schedule_lead_followup(
        p_lead_id INTEGER,
        p_followup_date TIMESTAMP WITH TIME ZONE,
        p_notes TEXT DEFAULT NULL,
        p_status TEXT DEFAULT 'pending',
        p_contact_method TEXT DEFAULT 'phone',
        p_priority TEXT DEFAULT 'medium',
        p_created_by TEXT DEFAULT 'system'
      ) RETURNS INTEGER AS $$
      DECLARE
        v_followup_id INTEGER;
      BEGIN
        -- Validate input parameters
        IF p_lead_id IS NULL THEN
          RAISE EXCEPTION 'Lead ID cannot be null';
        END IF;
        
        IF p_followup_date IS NULL THEN
          RAISE EXCEPTION 'Follow-up date cannot be null';
        END IF;
        
        -- Validate status
        IF p_status NOT IN ('pending', 'scheduled', 'completed', 'cancelled') THEN
          RAISE EXCEPTION 'Invalid status. Must be: pending, scheduled, completed, or cancelled';
        END IF;
        
        -- Validate priority
        IF p_priority NOT IN ('low', 'medium', 'high', 'urgent') THEN
          RAISE EXCEPTION 'Invalid priority. Must be: low, medium, high, or urgent';
        END IF;
        
        -- Validate contact method
        IF p_contact_method NOT IN ('phone', 'email', 'whatsapp', 'in_person', 'video_call') THEN
          RAISE EXCEPTION 'Invalid contact method. Must be: phone, email, whatsapp, in_person, or video_call';
        END IF;

        -- Insert the follow-up record
        INSERT INTO lead_followups (
          lead_id,
          scheduled_at,
          notes,
          status,
          contact_method,
          priority,
          created_by,
          created_at
        ) VALUES (
          p_lead_id,
          p_followup_date,
          p_notes,
          p_status,
          p_contact_method,
          p_priority,
          p_created_by,
          NOW()
        ) RETURNING id INTO v_followup_id;
        
        RETURN v_followup_id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE EXCEPTION 'Error creating follow-up: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `

    await query(createFunctionSQL)
    console.log("✅ [LEAD_FOLLOWUPS] Created schedule_lead_followup function")

    // Create additional utility functions
    const updateFollowupFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_lead_followup_status(
        p_followup_id INTEGER,
        p_status TEXT,
        p_completed_by TEXT DEFAULT NULL,
        p_outcome TEXT DEFAULT NULL,
        p_interaction_summary TEXT DEFAULT NULL,
        p_duration_minutes INTEGER DEFAULT NULL
      ) RETURNS BOOLEAN AS $$
      BEGIN
        -- Validate status
        IF p_status NOT IN ('pending', 'scheduled', 'completed', 'cancelled') THEN
          RAISE EXCEPTION 'Invalid status. Must be: pending, scheduled, completed, or cancelled';
        END IF;

        UPDATE lead_followups SET
          status = p_status,
          completed_by = CASE WHEN p_status = 'completed' THEN COALESCE(p_completed_by, completed_by) ELSE completed_by END,
          completed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE completed_at END,
          outcome = COALESCE(p_outcome, outcome),
          interaction_summary = COALESCE(p_interaction_summary, interaction_summary),
          duration_minutes = COALESCE(p_duration_minutes, duration_minutes),
          updated_at = NOW(),
          updated_by = COALESCE(p_completed_by, 'system')
        WHERE id = p_followup_id;

        RETURN FOUND;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE EXCEPTION 'Error updating follow-up: %', SQLERRM;
      END;
      $$ LANGUAGE plpgsql;
    `

    await query(updateFollowupFunctionSQL)
    console.log("✅ [LEAD_FOLLOWUPS] Created update_lead_followup_status function")

    // Create function to get pending followups
    const getPendingFollowupsSQL = `
      CREATE OR REPLACE FUNCTION get_pending_followups(
        p_limit INTEGER DEFAULT 50,
        p_offset INTEGER DEFAULT 0
      ) RETURNS TABLE (
        id INTEGER,
        lead_id INTEGER,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        contact_method TEXT,
        priority TEXT,
        notes TEXT,
        created_by TEXT,
        created_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          f.id,
          f.lead_id,
          f.scheduled_at,
          f.contact_method,
          f.priority,
          f.notes,
          f.created_by,
          f.created_at
        FROM lead_followups f
        WHERE f.status IN ('pending', 'scheduled')
          AND f.scheduled_at <= NOW() + INTERVAL '1 day'
        ORDER BY 
          CASE f.priority 
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
          END,
          f.scheduled_at ASC
        LIMIT p_limit
        OFFSET p_offset;
      END;
      $$ LANGUAGE plpgsql;
    `

    await query(getPendingFollowupsSQL)
    console.log("✅ [LEAD_FOLLOWUPS] Created get_pending_followups function")

    // Create function to get followup statistics
    const getFollowupStatsSQL = `
      CREATE OR REPLACE FUNCTION get_followup_statistics(
        p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
        p_end_date DATE DEFAULT CURRENT_DATE
      ) RETURNS TABLE (
        total_followups BIGINT,
        completed_followups BIGINT,
        pending_followups BIGINT,
        cancelled_followups BIGINT,
        completion_rate NUMERIC(5,2),
        avg_duration_minutes NUMERIC(10,2)
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          COUNT(*) as total_followups,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_followups,
          COUNT(*) FILTER (WHERE status IN ('pending', 'scheduled')) as pending_followups,
          COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_followups,
          ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
          ) as completion_rate,
          ROUND(AVG(duration_minutes) FILTER (WHERE duration_minutes IS NOT NULL), 2) as avg_duration_minutes
        FROM lead_followups
        WHERE created_at::DATE BETWEEN p_start_date AND p_end_date;
      END;
      $$ LANGUAGE plpgsql;
    `

    await query(getFollowupStatsSQL)
    console.log("✅ [LEAD_FOLLOWUPS] Created get_followup_statistics function")

    console.log("🎉 [LEAD_FOLLOWUPS] All lead followup functions created successfully!")
    return { 
      success: true, 
      message: "Lead followup functions created successfully with enhanced functionality" 
    }

  } catch (error: any) {
    console.error("❌ [LEAD_FOLLOWUPS] Error creating lead followup functions:", error)
    return {
      success: false,
      message: `Failed to create lead followup functions: ${error.message || "Unknown error"}`
    }
  }
}
