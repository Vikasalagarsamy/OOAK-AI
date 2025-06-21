/**
 * Centralized UUID utilities for consistent user ID handling
 * 
 * This solves the problem of having UUID conversions scattered throughout
 * the codebase and ensures consistent behavior everywhere.
 */

// Helper function to convert simple user IDs to UUID format for database compatibility
export function convertUserIdToUUID(userId: string | number): string {
  const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId
  
  switch (userIdNum) {
    case 1:
      return '00000000-0000-0000-0000-000000000001'  // Vikas
    case 2:
      return '00000000-0000-0000-0000-000000000002'  // Navya
    case 3:
      return '00000000-0000-0000-0000-000000000003'  // Pradeep
    default:
      // Generate UUID for any other user ID by padding with zeros
      const paddedId = userIdNum.toString().padStart(12, '0')
      return `00000000-0000-0000-0000-${paddedId}`
  }
}

// Helper function to validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper to get user ID in UUID format for database queries
export function getUserIdForDatabase(userId: string | number): string {
  const userIdStr = userId.toString()
  
  // If it's already a UUID, return as-is
  if (isValidUUID(userIdStr)) {
    return userIdStr
  }
  
  // Convert simple ID to UUID format
  return convertUserIdToUUID(userIdStr)
}

// Helper to check if a user ID needs conversion
export function needsUUIDConversion(userId: string): boolean {
  return !isValidUUID(userId)
}

// Type definitions
export type SimpleUserId = string | number
export type DatabaseUserId = string // Always UUID format

/**
 * Usage examples:
 * 
 * // In any action file:
 * import { getUserIdForDatabase } from '@/lib/uuid-helpers'
 * 
 * const user = await getCurrentUser()
 * const databaseUserId = getUserIdForDatabase(user.id)
 * 
 * // Use databaseUserId for all database queries
 * .eq('created_by', databaseUserId)
 */ 