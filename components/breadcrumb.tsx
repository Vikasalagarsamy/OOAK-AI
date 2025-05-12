"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()

  if (pathname === "/dashboard") {
    return null
  }

  const segments = pathname.split("/").filter(Boolean)

  if (segments.length === 0) {
    return null
  }

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      <Link href="/dashboard" className="flex items-center hover:text-foreground">
        <Home className="h-4 w-4 mr-1" />
        <span>Home</span>
      </Link>

      {segments.map((segment, index) => {
        const path = `/${segments.slice(0, index + 1).join("/")}`
        const isLast = index === segments.length - 1

        // Format the segment for display (capitalize, replace hyphens with spaces)
        const formattedSegment = segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase())

        return (
          <div key={path} className="flex items-center">
            <ChevronRight className="h-4 w-4 mx-1" />
            {isLast ? (
              <span className="font-medium text-foreground">{formattedSegment}</span>
            ) : (
              <Link href={path} className="hover:text-foreground">
                {formattedSegment}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}
