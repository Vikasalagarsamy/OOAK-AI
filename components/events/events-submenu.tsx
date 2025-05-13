"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Calendar, LayoutDashboard, ClipboardList, MapPin, Users } from "lucide-react"

const eventMenuItems = [
  {
    title: "Dashboard",
    href: "/events/dashboard",
    icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
  },
  {
    title: "Event Calendar",
    href: "/events/calendar",
    icon: <Calendar className="h-4 w-4 mr-2" />,
  },
  {
    title: "Events",
    href: "/events",
    icon: <Calendar className="h-4 w-4 mr-2" />,
  },
  {
    title: "Event Types",
    href: "/events/types",
    icon: <ClipboardList className="h-4 w-4 mr-2" />,
  },
  {
    title: "Venues",
    href: "/events/venues",
    icon: <MapPin className="h-4 w-4 mr-2" />,
  },
  {
    title: "Staff Assignment",
    href: "/events/staff-assignment",
    icon: <Users className="h-4 w-4 mr-2" />,
  },
]

export function EventsSubmenu() {
  const pathname = usePathname()

  return (
    <div className="flex overflow-auto pb-2 mb-6 border-b">
      <nav className="flex space-x-4">
        {eventMenuItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted",
            )}
          >
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
    </div>
  )
}
