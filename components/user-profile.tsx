"use client"

import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export function UserProfile() {
  const { user, isLoading, logout } = useAuth()
  const router = useRouter()

  async function handleLogout() {
    await logout()
    router.push("/auth/login")
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Loading...</CardTitle>
        </CardHeader>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Not logged in</CardTitle>
          <CardDescription>Please log in to view your profile</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/auth/login")} className="w-full">
            Log in
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Your Profile</CardTitle>
        <CardDescription>Welcome back, {user.username}!</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div>
            <span className="font-semibold">Username:</span> {user.username}
          </div>
          <div>
            <span className="font-semibold">Account created:</span> {new Date(user.created_at).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleLogout} variant="destructive" className="w-full">
          Log out
        </Button>
      </CardFooter>
    </Card>
  )
}
