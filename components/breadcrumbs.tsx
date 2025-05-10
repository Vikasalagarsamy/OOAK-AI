"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumbs() {
  const pathname = usePathname()

  // Skip rendering on the home page
  if (pathname === "/" || pathname === "/dashboard") {
    return null
  }

  // Split the pathname into segments
  const segments = pathname.split("/").filter(Boolean)

  // Create breadcrumb items
  const breadcrumbItems = [
    { name: "Home", path: "/dashboard" },
    ...segments.map((segment, index) => {
      // Create a path up to this segment
      const path = `/${segments.slice(0, index + 1).join("/")}`

      // Format the segment name (capitalize first letter, replace hyphens with spaces)
      const name = segment
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")

      return { name, path }
    }),
  ]

  return (
    <nav className="flex items-center text-sm text-muted-foreground mb-4">
      {breadcrumbItems.map((item, index) => (
        <div key={item.path} className="flex items-center">
          {index === 0 ? (
            <Link href={item.path} className="flex items-center hover:text-foreground">
              <Home className="h-4 w-4 mr-1" />
              {item.name}
            </Link>
          ) : (
            <Link href={item.path} className="hover:text-foreground">
              {item.name}
            </Link>
          )}

          {index < breadcrumbItems.length - 1 && <ChevronRight className="h-4 w-4 mx-2" />}
        </div>
      ))}
    </nav>
  )
}
