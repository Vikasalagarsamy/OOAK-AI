"use client"

import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export function AuthNav() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/auth/login")
  }

  if (isLoading) {
    return <div className="h-9"></div> // Placeholder with same height as buttons
  }

  if (!user) {
    return (
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/auth/login">Log in</Link>
        </Button>
        <Button asChild>
          <Link href="/auth/register">Register</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm hidden md:inline-block">Welcome, {user.username}</span>
      <Button asChild variant="outline">
        <Link href="/profile">Profile</Link>
      </Button>
      <Button onClick={handleLogout} variant="destructive" size="sm">
        Log out
      </Button>
    </div>
  )
}
