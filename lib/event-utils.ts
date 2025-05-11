/**
 * Generates a unique event ID with a prefix 'EVT-' followed by a random alphanumeric string
 */
export function generateEventId(): string {
  const prefix = "EVT-"
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  const length = 6
  let result = ""

  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }

  return `${prefix}${result}`
}
