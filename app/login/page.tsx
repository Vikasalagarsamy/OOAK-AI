"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { authenticate } from "@/actions/auth-actions"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Use a ref to track if we've already shown the toast for this parameter
  const redirectReasonShown = useRef(false)

  // Check if redirected from another page due to auth - use refs to prevent infinite loop
  useEffect(() => {
    const redirectReason = searchParams.get("reason")

    // Only show toast if we haven't shown it yet for this reason
    if (redirectReason === "unauthenticated" && !redirectReasonShown.current) {
      redirectReasonShown.current = true
      toast({
        title: "Authentication required",
        description: "Please login to access that page",
        variant: "destructive",
      })
    }
  }, [searchParams, toast])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess(false)

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      setIsLoading(false)
      return
    }

    try {
      console.log("Submitting login form...")
      const result = await authenticate(username, password)
      console.log("Authentication result:", result)

      if (result.success) {
        setSuccess(true)
        toast({
          title: "Login successful",
          description: "Welcome back! Redirecting to dashboard...",
        })

        // Small delay to ensure cookie is set before redirect
        setTimeout(() => {
          // Use window.location for a full page refresh to ensure proper state
          window.location.href = "/dashboard"
        }, 1000)
      } else {
        setError(result.error || "Authentication failed")
        toast({
          title: "Login failed",
          description: result.error || "Please check your credentials and try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Photography Portal</CardTitle>
          <CardDescription className="text-center">Enter your credentials to sign in</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4">
              <AlertDescription>Login successful! Redirecting to dashboard...</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="your.username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading || success}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <a href="#" className="text-sm text-blue-600 hover:text-blue-800">
                  Forgot password?
                </a>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading || success}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || success}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : success ? (
                "Redirecting..."
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <div className="text-center text-sm text-gray-500">This is a secure login for authorized personnel only.</div>
        </CardFooter>
      </Card>
    </div>
  )
}
