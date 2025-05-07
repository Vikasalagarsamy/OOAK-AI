import Link from "next/link"
import { LogOut, User } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { Button } from "./ui/button"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { getCurrentUser } from "@/actions/auth-actions"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { DynamicMenu } from "./dynamic-menu/dynamic-menu"

// Server action for logout
async function handleLogout() {
  "use server"
  cookies().set("auth_token", "", { expires: new Date(0) })
  redirect("/login")
}

export async function Header() {
  const user = await getCurrentUser()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center space-x-2">
          <span className="font-bold">ONE OF A KIND PORTAL</span>
        </Link>

        <div className="flex items-center justify-between flex-1">
          {/* Use the DynamicMenu component instead of hard-coded links */}
          <DynamicMenu className="mx-6" />

          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {user.firstName && user.lastName
                          ? `${user.firstName[0]}${user.lastName[0]}`
                          : user.username?.substring(0, 2).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email || user.username}</p>
                    <p className="text-xs text-muted-foreground">Role: {user.roleName || "Unknown"}</p>
                  </div>
                  <DropdownMenuItem asChild>
                    <form action={handleLogout}>
                      <button className="flex w-full items-center">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </button>
                    </form>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild size="sm">
                <Link href="/login">
                  <User className="mr-2 h-4 w-4" />
                  Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
