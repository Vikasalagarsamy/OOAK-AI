import { NextResponse } from "next/server"
import { getCurrentUser } from "@/actions/auth-actions"

export async function GET() {
  try {
    // Check if user is authenticated and is an admin
    const user = await getCurrentUser()

    if (!user || user.roleName !== "Administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // List of environment variables to check
    const varsToCheck = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      "SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
      "SUPABASE_ANON_KEY",
      "JWT_SECRET",
      "NODE_ENV",
    ]

    // Check which variables are defined
    const envVars: Record<string, string | undefined> = {}

    for (const varName of varsToCheck) {
      // Only check if defined, don't expose actual values for security
      envVars[varName] = process.env[varName] ? "defined" : undefined
    }

    return NextResponse.json({
      envVars,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error checking environment variables:", error)
    return NextResponse.json({ error: "Failed to check environment variables" }, { status: 500 })
  }
}
