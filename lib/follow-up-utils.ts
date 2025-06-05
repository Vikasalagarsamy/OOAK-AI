import type { FollowUpStatus, LeadStatus } from "@/types/follow-up"
import { VALID_STATUS_TRANSITIONS, SUGGESTED_LEAD_STATUS_BY_OUTCOME } from "@/types/follow-up"

// Status transition validation
export function validateStatusTransition(currentStatus: FollowUpStatus, newStatus: FollowUpStatus): boolean {
  return VALID_STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

// Function to get suggested lead statuses based on outcome
export function getSuggestedLeadStatuses(outcome: string): LeadStatus[] {
  if (!outcome) return []
  
  const lowerOutcome = outcome.toLowerCase()
  
  // Sort keys by length (longest first) to prioritize more specific matches
  const sortedKeys = Object.keys(SUGGESTED_LEAD_STATUS_BY_OUTCOME).sort((a, b) => b.length - a.length)
  
  // Check for matches, prioritizing longer/more specific keywords
  for (const key of sortedKeys) {
    if (lowerOutcome.includes(key)) {
      return SUGGESTED_LEAD_STATUS_BY_OUTCOME[key]
    }
  }
  
  return []
}

// Helper function to get date ranges for smart filtering
export function getDateRanges() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay()) // Start of week (Sunday)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // End of week (Saturday)
  endOfWeek.setHours(23, 59, 59, 999)

  return {
    now: now.toISOString(),
    today: today.toISOString(),
    tomorrow: tomorrow.toISOString(),
    startOfWeek: startOfWeek.toISOString(),
    endOfWeek: endOfWeek.toISOString()
  }
} 