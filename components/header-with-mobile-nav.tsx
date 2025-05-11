import Link from "next/link"
import { MobileNavigation } from "@/components/mobile-navigation"
import { LogoutButton } from "@/components/logout-button"
import { getCurrentUser } from "@/lib/auth-utils"
import { Badge } from "@/components/ui/badge"

export async function HeaderWithMobileNav() {
  const user = await getCurrentUser()
  const isAdmin = user?.isAdmin || false

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <MobileNavigation />
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Company Manager</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <div className="flex items-center">
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-sm">{user.username}</span>
                {isAdmin && <Badge variant="destructive">Admin</Badge>}
                <LogoutButton />
              </div>
            ) : (
              <Link href="/login" className="text-sm font-medium">
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
