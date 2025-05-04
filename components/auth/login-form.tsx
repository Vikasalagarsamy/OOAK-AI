"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { loginUser } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

export function LoginForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(event.currentTarget)

    try {
      const result = await loginUser(formData)

      if (result.success) {
        toast({
          title: "Login successful",
          description: "You have been logged in successfully.",
          variant: "default",
        })
        router.push("/")
        router.refresh()
      } else {
        setError(result.message || "Login failed")
        toast({
          title: "Login failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      setError("An unexpected error occurred")
      toast({
        title: "An error occurred",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Log in to your account</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">{error}</div>}
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" placeholder="Enter your username" required />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/auth/forgot-password" className="text-sm text-blue-500 hover:text-blue-700">
                Forgot password?
              </Link>
            </div>
            <Input id="password" name="password" type="password" placeholder="Enter your password" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Log in"}
          </Button>
          <p className="text-sm text-center text-gray-500">
            Don't have an account?{" "}
            <Link href="/auth/register" className="text-blue-500 hover:text-blue-700">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
