"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    console.log("🚀 Submitting login form with username:", username)

    try {
      // First, try to make a simple GET request to check if the API is accessible
      const healthCheck = await fetch("/api/auth/status")
      console.log("🏥 Health check status:", healthCheck.status)

      // Log the request details
      console.log("📤 Sending login request with:", {
        url: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
      })

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include', // Important for cookies
      })

      console.log("📨 Response status:", response.status)
      
      // Log response headers for debugging
      const headers = Object.fromEntries(response.headers.entries())
      console.log("📋 Response headers:", headers)

      // Get the response text first
      const text = await response.text()
      console.log("📝 Raw response:", text)

      let data
      try {
        // Try to parse the text as JSON
        data = JSON.parse(text)
        console.log("📦 Parsed response data:", { success: data.success, error: data.error })
      } catch (parseError) {
        console.error("❌ Failed to parse response as JSON:", parseError)
        throw new Error("Failed to parse server response")
      }

      if (data.success) {
        console.log("✅ Login successful")
        toast({
          title: "Success",
          description: "Login successful! Redirecting...",
        })
        
        // Get the redirect URL from query params or default to dashboard
        const redirectTo = searchParams.get('from') || '/dashboard'
        console.log("🔄 Attempting to redirect to:", redirectTo)

        // Force a hard redirect
        window.location.href = redirectTo
        
        // Fallback: If the redirect doesn't happen within 2 seconds, try router.push
        setTimeout(() => {
          console.log("⚠️ Redirect timeout - trying router.push")
          router.push(redirectTo)
        }, 2000)

        // Final fallback: If nothing works after 4 seconds, reload the page
        setTimeout(() => {
          console.log("⚠️ Router push timeout - reloading page")
          window.location.reload()
        }, 4000)
      } else {
        console.log("❌ Login failed:", data.error)
        setError(data.error || "Invalid credentials")
        toast({
          title: "Error",
          description: data.error || "Invalid credentials",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("❌ Login error:", err)
      setError("An unexpected error occurred. Please check the console for details.")
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to your account</CardTitle>
          <CardDescription>Enter your credentials to access the dashboard</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                disabled={isLoading}
                placeholder="Enter your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
