"use server"

import { createClient } from "@/lib/supabase-server"
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
  const supabase = createClient()

  const { data, error } = await supabase.from("events").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching events:", error)
    throw new Error("Failed to fetch events")
  }

  return data || []
}

// Create a new event
export async function createEvent(name: string, isActive: boolean): Promise<Event> {
  const supabase = createClient()

  // Generate a very short ID that definitely fits within varchar(20)
  const event_id = generateShortId()

  console.log("Generated event_id:", event_id, "Length:", event_id.length)

  try {
    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          event_id,
          name,
          is_active: isActive,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating event:", error)
      throw new Error(`Failed to create event: ${error.message}`)
    }

    revalidatePath("/events")
    return data
  } catch (error: any) {
    console.error("Exception in createEvent:", error)
    throw new Error(`Error creating event: ${error.message}`)
  }
}

// Edit an existing event
export async function updateEvent(eventId: string, name: string, isActive: boolean): Promise<Event> {
  const supabase = createClient()

  try {
    const { data, error } = await supabase
      .from("events")
      .update({
        name,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("event_id", eventId)
      .select()
      .single()

    if (error) {
      console.error("Error updating event:", error)
      throw new Error(`Failed to update event: ${error.message}`)
    }

    revalidatePath("/events")
    return data
  } catch (error: any) {
    console.error("Exception in updateEvent:", error)
    throw new Error(`Error updating event: ${error.message}`)
  }
}

// Delete an event
export async function deleteEvent(eventId: string): Promise<void> {
  const supabase = createClient()

  try {
    const { error } = await supabase.from("events").delete().eq("event_id", eventId)

    if (error) {
      console.error("Error deleting event:", error)
      throw new Error(`Failed to delete event: ${error.message}`)
    }

    revalidatePath("/events")
  } catch (error: any) {
    console.error("Exception in deleteEvent:", error)
    throw new Error(`Error deleting event: ${error.message}`)
  }
}

// Toggle event status
export async function toggleEventStatus(eventId: string): Promise<Event> {
  const supabase = createClient()

  // First, get the current status
  const { data: event, error: fetchError } = await supabase
    .from("events")
    .select("is_active")
    .eq("event_id", eventId)
    .single()

  if (fetchError) {
    console.error("Error fetching event status:", fetchError)
    throw new Error("Failed to fetch event status")
  }

  // Toggle the status
  const { data, error } = await supabase
    .from("events")
    .update({
      is_active: !event.is_active,
      updated_at: new Date().toISOString(),
    })
    .eq("event_id", eventId)
    .select()
    .single()

  if (error) {
    console.error("Error updating event status:", error)
    throw new Error("Failed to update event status")
  }

  revalidatePath("/events")
  return data
}

// Search events
export async function searchEvents(query: string): Promise<Event[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .or(`name.ilike.%${query}%,event_id.ilike.%${query}%`)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error searching events:", error)
    throw new Error("Failed to search events")
  }

  return data || []
}
