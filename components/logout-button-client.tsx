"use client"

import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function LogoutButtonClient() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

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
        console.error("Logout failed:", await response.text())
        // Still redirect to login page even if logout fails
        router.push("/login?error=logout_failed")
      }
    } catch (error) {
      console.error("Logout error:", error)
      router.push("/login?error=logout_failed")
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <Button
      onClick={handleLogout}
      variant="ghost"
      className="flex items-center text-red-500 hover:text-red-700 hover:bg-red-50"
      disabled={isLoggingOut}
    >
      <LogOut className="mr-2 h-4 w-4" />
      <span>{isLoggingOut ? "Logging out..." : "Log out"}</span>
    </Button>
  )
}
