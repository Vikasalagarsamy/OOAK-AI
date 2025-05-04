"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { LogIn, UserPlus, User, Settings, LogOut } from "lucide-react"

export function AccountOptions() {
  const { user, isLoading, logout } = useAuth()

  if (isLoading) {
    return (
      <>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
      </>
    )
  }

  if (!user) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login
            </CardTitle>
            <CardDescription>Sign in to your existing account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Access your account to manage your profile, view your leads, and more.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/login">
              <Button>Login</Button>
            </Link>
          </CardFooter>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Register
            </CardTitle>
            <CardDescription>Create a new account</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Join our platform to access all features and manage your business efficiently.
            </p>
          </CardContent>
          <CardFooter>
            <Link href="/auth/register">
              <Button>Register</Button>
            </Link>
          </CardFooter>
        </Card>
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>View and manage your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Username: <span className="text-muted-foreground">{user.username}</span>
            </p>
            <p className="text-sm font-medium">
              Account created:{" "}
              <span className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</span>
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Link href="/profile">
            <Button>View Profile</Button>
          </Link>
        </CardFooter>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Account Settings
          </CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Update your password, notification preferences, and security settings.
          </p>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Link href="/profile/settings">
            <Button variant="outline">Settings</Button>
          </Link>
          <Button
            variant="destructive"
            onClick={async () => {
              await logout()
              window.location.href = "/auth/login"
            }}
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardFooter>
      </Card>
    </>
  )
}
