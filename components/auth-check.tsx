"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function AuthCheck() {
  const [checking, setChecking] = useState(true)
  const router = useRouter()
  const { toast } = useToast()
  const hasRedirected = useRef(false)

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/status")
        const data = await res.json()

        if (!data.authenticated && !hasRedirected.current) {
          hasRedirected.current = true
          toast({
            title: "Session expired",
            description: "Please log in again to continue.",
            variant: "destructive",
          })
          router.push("/login?reason=session_expired")
        }
      } catch (error) {
        console.error("Auth check error:", error)
      } finally {
        setChecking(false)
      }
    }

    checkAuth()
  }, [router, toast])

  return null // This component doesn't render anything
}
