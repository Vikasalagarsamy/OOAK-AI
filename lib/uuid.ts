/**
 * Checks if a string is a valid UUID
 */
export function isValidUuid(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(str)
}

/**
 * Generates a deterministic UUID v5 from a namespace and a string
 */
export function generateDeterministicUuid(namespace: string, value: string): string {
  // This is a simplified implementation that doesn't actually generate a proper UUID v5
  // but it's deterministic and will always return the same value for the same inputs

  // Create a hash from the namespace and value
  const hash = simpleHash(`${namespace}:${value}`)

  // Format the hash as a UUID
  const uuid = [
    hash.substring(0, 8),
    hash.substring(8, 12),
    // Version 5 UUID has the first digit of this group as 5
    "5" + hash.substring(13, 16),
    // Variant 1 UUID has the first digit of this group as 8, 9, a, or b
    "8" + hash.substring(17, 20),
    hash.substring(20, 32),
  ].join("-")

  return uuid
}

/**
 * Simple hash function that returns a hex string
 */
function simpleHash(str: string): string {
  let hash = 0

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  // Convert to a positive hex string with leading zeros
  const hexHash = (hash >>> 0).toString(16).padStart(32, "0")

  return hexHash
}
