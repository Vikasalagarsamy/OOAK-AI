"use server"

import { query, transaction } from "@/lib/postgresql-client"
import { revalidatePath } from "next/cache"
import type { Event } from "@/types/event"

// Function to generate a very short unique ID (definitely under 20 chars)
function generateShortId(): string {
  // Generate a random string of 8 characters
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // Removed confusing chars like O, 0, I, 1
  let result = "E"
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result // Total length: 9 characters
}

// Get all events
export async function getEvents(): Promise<Event[]> {
  try {
    console.log('🎯 [EVENTS] Fetching events via PostgreSQL...')

    const result = await query(`
      SELECT * FROM events 
      ORDER BY created_at DESC
    `)

    console.log(`✅ [EVENTS] Fetched ${result.rows.length} events via PostgreSQL`)
    return result.rows || []
  } catch (error: any) {
    console.error("❌ [EVENTS] Error fetching events:", error)
    throw new Error("Failed to fetch events")
  }
}

// Create a new event
export async function createEvent(name: string, isActive: boolean): Promise<Event> {
  try {
    console.log('➕ [EVENTS] Creating new event via PostgreSQL...')

    // Generate a very short ID that definitely fits within varchar(20)
    const event_id = generateShortId()
    console.log("Generated event_id:", event_id, "Length:", event_id.length)

    const result = await query(`
      INSERT INTO events (event_id, name, is_active, created_at)
      VALUES ($1, $2, $3, NOW())
      RETURNING *
    `, [event_id, name, isActive])

    if (result.rows.length === 0) {
      throw new Error("Failed to create event - no data returned")
    }

    const event = result.rows[0]
    revalidatePath("/events")
    console.log(`✅ [EVENTS] Event created successfully: ${event.event_id}`)
    return event
  } catch (error: any) {
    console.error("❌ [EVENTS] Error creating event:", error)
    throw new Error(`Error creating event: ${error.message}`)
  }
}

// Edit an existing event
export async function updateEvent(eventId: string, name: string, isActive: boolean): Promise<Event> {
  try {
    console.log(`📝 [EVENTS] Updating event ${eventId} via PostgreSQL...`)

    const result = await query(`
      UPDATE events
      SET 
        name = $1,
        is_active = $2,
        updated_at = NOW()
      WHERE event_id = $3
      RETURNING *
    `, [name, isActive, eventId])

    if (result.rows.length === 0) {
      throw new Error("Event not found or failed to update")
    }

    const event = result.rows[0]
    revalidatePath("/events")
    console.log(`✅ [EVENTS] Event ${eventId} updated successfully`)
    return event
  } catch (error: any) {
    console.error("❌ [EVENTS] Error updating event:", error)
    throw new Error(`Error updating event: ${error.message}`)
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<void> {
  try {
    console.log(`🗑️ [EVENTS] Deleting event ${eventId} via PostgreSQL...`)

    const result = await query(`
      DELETE FROM events 
      WHERE event_id = $1
      RETURNING event_id
    `, [eventId])

    if (result.rows.length === 0) {
      throw new Error("Event not found or failed to delete")
    }

    revalidatePath("/events")
    console.log(`✅ [EVENTS] Event ${eventId} deleted successfully`)
  } catch (error: any) {
    console.error("❌ [EVENTS] Error deleting event:", error)
    throw new Error(`Error deleting event: ${error.message}`)
  }
}

// Toggle event status
export async function toggleEventStatus(eventId: string): Promise<Event> {
  try {
    console.log(`🔄 [EVENTS] Toggling status for event ${eventId} via PostgreSQL...`)

    // Use PostgreSQL to toggle status in a single query
    const result = await query(`
      UPDATE events
      SET 
        is_active = NOT is_active,
        updated_at = NOW()
      WHERE event_id = $1
      RETURNING *
    `, [eventId])

    if (result.rows.length === 0) {
      throw new Error("Event not found or failed to toggle status")
    }

    const event = result.rows[0]
    revalidatePath("/events")
    console.log(`✅ [EVENTS] Event ${eventId} status toggled to ${event.is_active}`)
    return event
  } catch (error: any) {
    console.error("❌ [EVENTS] Error toggling event status:", error)
    throw new Error("Failed to update event status")
  }
}

// Search events
export async function searchEvents(query_string: string): Promise<Event[]> {
  try {
    console.log(`🔍 [EVENTS] Searching events for "${query_string}" via PostgreSQL...`)

    const result = await query(`
      SELECT * FROM events
      WHERE name ILIKE $1 OR event_id ILIKE $1
      ORDER BY created_at DESC
    `, [`%${query_string}%`])

    console.log(`✅ [EVENTS] Found ${result.rows.length} events matching "${query_string}"`)
    return result.rows || []
  } catch (error: any) {
    console.error("❌ [EVENTS] Error searching events:", error)
    throw new Error("Failed to search events")
  }
}
