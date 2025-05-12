"use client"

import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"

export default function LogoutPage() {
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Auto-logout when the page loads
  useEffect(() => {
    handleLogout()
  }, [])

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Call the logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        // Redirect to login page on successful logout
        router.push("/login")
        router.refresh()
      } else {
        const errorText = await response.text()
        console.error("Logout failed:", errorText)
        setError("Failed to log out. Please try again.")
        // Don't redirect automatically on error
      }
    } catch (error) {
      console.error("Logout error:", error)
      setError("An error occurred during logout. Please try again.")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Logging Out</h1>
          {error ? (
            <>
              <p className="mb-6 text-red-600">{error}</p>
              <Button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-md"
                disabled={isLoggingOut}
              >
                {isLoggingOut ? "Logging out..." : "Try Again"}
              </Button>
            </>
          ) : (
            <p className="mb-6 text-gray-600">
              {isLoggingOut ? "Logging you out..." : "You have been logged out successfully."}
            </p>
          )}

          {!isLoggingOut && !error && (
            <Button
              onClick={() => router.push("/login")}
              className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md"
            >
              Return to Login
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
