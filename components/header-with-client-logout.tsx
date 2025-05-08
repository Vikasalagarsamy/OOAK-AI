"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { LogOut, User, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { DynamicMenu } from "./dynamic-menu/dynamic-menu"

type HeaderProps = {
  username?: string
}

export function HeaderWithClientLogout({ username }: HeaderProps) {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        })
        router.push("/login")
      } else {
        toast({
          title: "Logout failed",
          description: "There was an error logging out. Please try again.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
      toast({
        title: "Logout failed",
        description: "There was an error logging out. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRefreshSession = async () => {
    try {
      const response = await fetch("/api/auth/refresh-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Session Refreshed",
          description: "Your session has been refreshed with the latest permissions.",
          variant: "default",
        })

        // Refresh the current page to apply new permissions
        router.refresh()
      } else {
        toast({
          title: "Refresh Failed",
          description: data.error || "Failed to refresh session. Please try logging out and back in.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error refreshing session:", error)
      toast({
        title: "Refresh Failed",
        description: "An error occurred while refreshing your session.",
        variant: "destructive",
      })
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">Company Manager</span>
          </Link>
          <DynamicMenu />
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <div className="hidden md:block">{/* Mobile nav is handled separately */}</div>
          </div>
          <div className="flex items-center gap-2">
            {username && (
              <>
                <Button variant="ghost" size="sm" onClick={handleRefreshSession} className="gap-1">
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <div className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  <span className="text-sm font-medium">{username}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
