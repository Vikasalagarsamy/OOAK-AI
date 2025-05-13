"use client"
import Link from "next/link"
import { LogOut, Settings, User, Moon, Sun, Shield } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"
import { MobileNavigation } from "./mobile-navigation"
import { useTheme } from "next-themes"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Skeleton } from "./ui/skeleton"
import { NotificationsDropdown } from "./notifications/notifications-dropdown"

export function Header() {
  const { theme, setTheme } = useTheme()
  const { user, loading } = useCurrentUser()

  // Generate avatar initials from user data
  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    }
    if (user?.username) {
      return user.username.substring(0, 2).toUpperCase()
    }
    return "AU" // Default fallback
  }

  // Get display name
  const getDisplayName = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName} ${user.lastName}`
    }
    if (user?.username) {
      return user.username
    }
    return "Administrator" // Default fallback
  }

  // Toggle theme function
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-2 md:gap-4">
          <MobileNavigation />
          <Link href="/" className="flex items-center gap-2">
            <span className="font-bold text-xl">ONE OF A KIND PORTAL</span>
          </Link>
        </div>

        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="h-9 w-9"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <NotificationsDropdown />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="/abstract-geometric-shapes.png" alt="User avatar" />
                  <AvatarFallback>{getInitials()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              {loading ? (
                <div className="flex flex-col space-y-2 p-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div className="flex flex-col space-y-1 p-2">
                  <div className="flex items-center">
                    <p className="text-sm font-medium">{getDisplayName()}</p>
                    {user?.isAdmin && (
                      <div className="ml-2 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 px-1.5 py-0.5 rounded-sm text-xs flex items-center">
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{user?.email || ""}</p>
                  <p className="text-xs text-muted-foreground">Role: {user?.roleName || "User"}</p>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings" className="flex items-center">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/auth/logout" className="flex w-full items-center text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
