import { v4 as uuidv4 } from "uuid"

// Generate a proper UUID for the database
export const generateEventId = (): string => {
  return uuidv4()
}

// Format date for display
export const formatEventDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Generate a display ID for events (for UI purposes only)
export const generateEventDisplayId = (id: string): string => {
  // Take the first 8 characters of the UUID
  const shortId = id.substring(0, 8).toUpperCase()
  return `EVT-${shortId}`
}
