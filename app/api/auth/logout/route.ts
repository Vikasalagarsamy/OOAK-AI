import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("auth_token")

    // Return a simple text response
    return new NextResponse("Logged out successfully. Please go back to the login page.", {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    })
  } catch (error) {
    console.error("Logout GET error:", error)
    return new NextResponse("Error during logout", { status: 500 })
  }
}

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear all auth-related cookies
    cookieStore.delete("auth_token")
    cookieStore.delete("user_id")
    
    return NextResponse.json({ 
      success: true, 
      message: "Logged out successfully" 
    })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ 
      success: false, 
      message: "Error during logout" 
    }, { status: 500 })
  }
}
