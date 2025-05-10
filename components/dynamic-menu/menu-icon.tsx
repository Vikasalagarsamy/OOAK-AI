"use client"

import {
  Building,
  Building2,
  CircleDot,
  GitBranch,
  LayoutDashboard,
  Package,
  Shield,
  Truck,
  TrendingUp,
  User,
  UserCog,
  UserPlus,
  Users,
  type LucideIcon,
  type LightbulbIcon as LucideProps,
} from "lucide-react"

interface MenuIconProps extends LucideProps {
  name?: string
}

export function MenuIcon({ name, ...props }: MenuIconProps) {
  const iconMap: Record<string, LucideIcon> = {
    building: Building,
    "building-2": Building2,
    "circle-dot": CircleDot,
    "git-branch": GitBranch,
    "layout-dashboard": LayoutDashboard,
    package: Package,
    shield: Shield,
    truck: Truck,
    "trending-up": TrendingUp,
    user: User,
    "user-cog": UserCog,
    "user-plus": UserPlus,
    users: Users,
  }

  // Convert kebab-case to camelCase for compatibility
  const normalizedName = name?.toLowerCase().replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())

  // Find the icon component
  const Icon = name ? iconMap[name] || iconMap[normalizedName || ""] || CircleDot : CircleDot

  return <Icon {...props} />
}
