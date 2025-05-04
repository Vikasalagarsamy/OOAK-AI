"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase-server"
import { redirect } from "next/navigation"
import crypto from "crypto"

// Helper function to hash passwords
function hashPassword(password: string): string {
  // In a production environment, you should use bcrypt or Argon2
  // This is a simple SHA-256 hash for demonstration purposes
  return crypto.createHash("sha256").update(password).digest("hex")
}

// Validate username
function validateUsername(username: string): boolean {
  return username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username)
}

// Validate password
function validatePassword(password: string): boolean {
  return password.length >= 8
}

export async function registerUser(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string
  const confirmPassword = formData.get("confirmPassword") as string

  // Validate input
  if (!username || !password || !confirmPassword) {
    return { success: false, message: "All fields are required" }
  }

  if (!validateUsername(username)) {
    return {
      success: false,
      message: "Username must be 3-20 characters and contain only letters, numbers, and underscores",
    }
  }

  if (!validatePassword(password)) {
    return { success: false, message: "Password must be at least 8 characters long" }
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Passwords do not match" }
  }

  // Hash the password
  const hashedPassword = hashPassword(password)

  // Create Supabase client
  const supabase = createClient()

  // Check if username already exists
  const { data: existingUser } = await supabase.from("users").select("id").eq("username", username).single()

  if (existingUser) {
    return { success: false, message: "Username already exists" }
  }

  // Insert new user
  const { data, error } = await supabase
    .from("users")
    .insert([{ username, password: hashedPassword }])
    .select()

  if (error) {
    console.error("Error registering user:", error)
    return { success: false, message: "Error registering user" }
  }

  return { success: true, message: "Registration successful" }
}

export async function loginUser(formData: FormData) {
  const username = formData.get("username") as string
  const password = formData.get("password") as string

  // Validate input
  if (!username || !password) {
    return { success: false, message: "Username and password are required" }
  }

  // Hash the password
  const hashedPassword = hashPassword(password)

  // Create Supabase client
  const supabase = createClient()

  // Find user
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .eq("password", hashedPassword)
    .single()

  if (error || !user) {
    return { success: false, message: "Invalid username or password" }
  }

  // Set session cookie
  cookies().set("session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24, // 1 day
    path: "/",
  })

  return { success: true, message: "Login successful", user }
}

export async function logout() {
  cookies().delete("session")
  redirect("/auth/login")
}

export async function getCurrentUser() {
  const supabase = createClient()
  const sessionCookie = cookies().get("session")

  if (!sessionCookie?.value) {
    return null
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, username, created_at")
    .eq("id", sessionCookie.value)
    .single()

  if (error || !user) {
    cookies().delete("session")
    return null
  }

  return user
}

// Redirect if user is not authenticated
export async function requireAuth() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/auth/login")
  }

  return user
}

// Redirect if user is authenticated
export async function requireGuest() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/profile")
  }
}
