"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { registerUser } from "@/actions/auth-actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"
import { validateUsername, validatePasswordStrength } from "@/lib/auth-utils"

export function RegisterForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{
    username?: string
    password?: string
    confirmPassword?: string
  }>({})

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)
    setErrors({})

    const formData = new FormData(event.currentTarget)
    const username = formData.get("username") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Client-side validation
    let hasErrors = false
    const newErrors: typeof errors = {}

    const usernameValidation = validateUsername(username)
    if (!usernameValidation.valid) {
      newErrors.username = usernameValidation.message
      hasErrors = true
    }

    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message
      hasErrors = true
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
      hasErrors = true
    }

    if (hasErrors) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const result = await registerUser(formData)

      if (result.success) {
        toast({
          title: "Registration successful",
          description: "Your account has been created. You can now log in.",
          variant: "default",
        })
        router.push("/auth/login")
      } else {
        toast({
          title: "Registration failed",
          description: result.message,
          variant: "destructive",
        })
        setErrors({ username: result.message })
      }
    } catch (error) {
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
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>Enter your information to create an account</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              placeholder="Enter your username"
              required
              aria-invalid={!!errors.username}
              aria-describedby={errors.username ? "username-error" : undefined}
            />
            {errors.username && (
              <p id="username-error" className="text-sm text-red-500">
                {errors.username}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-500">
                {errors.password}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              required
              aria-invalid={!!errors.confirmPassword}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
            />
            {errors.confirmPassword && (
              <p id="confirm-password-error" className="text-sm text-red-500">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating account..." : "Create account"}
          </Button>
          <p className="text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-blue-500 hover:text-blue-700">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  )
}
