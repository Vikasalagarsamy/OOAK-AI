"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = () => {
    // Clear the auth token cookie using JavaScript
    document.cookie = "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"

    // Redirect to login page
    router.push("/login")
  }

  return (
    <Button variant="ghost" onClick={handleLogout} className="flex items-center">
      <LogOut className="mr-2 h-4 w-4" />
      <span>Log out</span>
    </Button>
  )
}
