import { createHash } from "crypto"
import { cookies } from "next/headers"

// Secure password hashing using SHA-256
// In a production environment, consider using bcrypt or Argon2
export async function hashPassword(password: string): Promise<string> {
  return createHash("sha256").update(password).digest("hex")
}

// Validate password against stored hash
export async function validatePassword(password: string, hashedPassword: string): Promise<boolean> {
  const hashedInput = await hashPassword(password)
  return hashedInput === hashedPassword
}

// Session management
export function createSession(userId: string): void {
  // Create a session cookie that expires in 24 hours
  cookies().set({
    name: "session",
    value: userId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  })
}

export function getSession(): string | undefined {
  return cookies().get("session")?.value
}

export function clearSession(): void {
  cookies().delete("session")
}

// Input validation
export function validateUsername(username: string): { valid: boolean; message?: string } {
  if (!username) {
    return { valid: false, message: "Username is required" }
  }

  if (username.length < 3) {
    return { valid: false, message: "Username must be at least 3 characters" }
  }

  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, message: "Username can only contain letters, numbers, and underscores" }
  }

  return { valid: true }
}

export function validatePasswordStrength(password: string): { valid: boolean; message?: string } {
  if (!password) {
    return { valid: false, message: "Password is required" }
  }

  if (password.length < 8) {
    return { valid: false, message: "Password must be at least 8 characters" }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Password must contain at least one number" }
  }

  return { valid: true }
}
