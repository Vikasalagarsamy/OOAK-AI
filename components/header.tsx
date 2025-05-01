import Link from "next/link"
import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <MobileNav />
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">ONE OF A KIND</span>
          </Link>
        </div>
        <MainNav />
        <div className="flex flex-1 items-center justify-end">
          {/* Add user menu or other header items here if needed */}
        </div>
      </div>
    </header>
  )
}
