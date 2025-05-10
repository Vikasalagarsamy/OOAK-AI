import type { LucideIcon } from "lucide-react"
import * as Icons from "lucide-react"

interface MenuIconProps {
  name: string
  className?: string
}

export function MenuIcon({ name, className }: MenuIconProps) {
  // Default to CircleDot if no icon name is provided
  if (!name) {
    return <Icons.CircleDot className={className} />
  }

  // Convert kebab-case to PascalCase for Lucide icons
  const iconName = name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")

  // Get the icon component from Lucide
  const Icon = (Icons as Record<string, LucideIcon>)[iconName] || Icons.CircleDot

  return <Icon className={className} />
}
