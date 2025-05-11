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
import { Loader2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isPreview, setIsPreview] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Keep track of login attempts
  const loginAttempts = useRef(0)
  const lastAttemptTime = useRef(0)

  // Use refs to track if we've already shown toasts
  const reasonToastShown = useRef(false)

  // Get redirect path from URL params
  const redirectPath = searchParams.get("redirect") || "/dashboard"

  // Detect preview environment
  useEffect(() => {
    if (typeof window !== "undefined") {
      const env =
        window.location.hostname === "localhost" ||
        window.location.origin.includes("vercel.app") ||
        window.location.origin.includes("v0.dev")
      setIsPreview(env)
    }
  }, [])

  // Check for authentication errors - only once when params change
  useEffect(() => {
    const reason = searchParams.get("reason")

    // Only show toast if we haven't shown it yet for this reason
    if (reason === "unauthenticated" && !reasonToastShown.current) {
      reasonToastShown.current = true

      // Use setTimeout to delay the toast until after render
      setTimeout(() => {
        toast({
          title: "Authentication required",
          description: "Please login to access that page",
          variant: "destructive",
        })
      }, 100)
    }
  }, [searchParams, toast])

  // Handle rate limiting
  function shouldThrottleRequest() {
    const now = Date.now()
    const timeSinceLastAttempt = now - lastAttemptTime.current

    // Reset attempts counter after 1 minute of inactivity
    if (timeSinceLastAttempt > 60000) {
      loginAttempts.current = 0
      return false
    }

    // Enforce increasingly longer delays based on number of attempts
    if (loginAttempts.current >= 3) {
      const requiredDelay = Math.min(30000, loginAttempts.current * 2000)
      return timeSinceLastAttempt < requiredDelay
    }

    return false
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    // Rate limiting check
    if (shouldThrottleRequest()) {
      const waitTime = Math.ceil((loginAttempts.current * 2000) / 1000)
      setError(`Too many login attempts. Please wait ${waitTime} seconds before trying again.`)
      toast({
        title: "Rate limited",
        description: `Too many attempts. Please wait ${waitTime} seconds.`,
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess(false)

    // Track this attempt
    loginAttempts.current += 1
    lastAttemptTime.current = Date.now()

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required")
      setIsLoading(false)
      return
    }

    try {
      console.log("Submitting login form...")
      const result = await authenticate(username, password)
      console.log("Authentication result:", result.success)

      if (result.success) {
        setSuccess(true)
        loginAttempts.current = 0 // Reset attempts on success

        // Use setTimeout to delay the toast until after state updates
        setTimeout(() => {
          toast({
            title: "Login successful",
            description: "Welcome back! Redirecting...",
          })

          // Small delay to ensure cookie is set before redirect
          setTimeout(() => {
            // Use window.location for a full page refresh to ensure proper state
            window.location.href = redirectPath
          }, 1000)
        }, 100)
      } else {
        setError(result.error || "Authentication failed")

        // Use setTimeout to delay the toast until after state updates
        setTimeout(() => {
          toast({
            title: "Login failed",
            description: result.error || "Please check your credentials and try again.",
            variant: "destructive",
          })
        }, 100)
      }
    } catch (err: any) {
      console.error("Login error:", err)

      // Check for rate limiting errors
      if (err?.message?.includes("Too Many Request") || err?.status === 429) {
        setError("Too many login attempts. Please wait before trying again.")
      } else {
        setError("An unexpected error occurred. Please try again.")
      }

      // Use setTimeout to delay the toast until after state updates
      setTimeout(() => {
        toast({
          title: "Error",
          description: err?.message || "An unexpected error occurred. Please try again.",
          variant: "destructive",
        })
      }, 100)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">ONE OF A KIND PORTAL</h1>
        </div>

        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Photography Portal</CardTitle>
            <CardDescription className="text-center">Enter your credentials to sign in</CardDescription>
          </CardHeader>
          <CardContent>
            {isPreview && (
              <Alert className="mb-4 bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Preview Mode:</strong> Use username <code className="bg-blue-100 px-1 rounded">admin</code>{" "}
                  and password <code className="bg-blue-100 px-1 rounded">admin</code> to login.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4">
                <AlertDescription>Login successful! Redirecting...</AlertDescription>
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
            <div className="text-center text-sm text-gray-500">
              This is a secure login for authorized personnel only.
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
