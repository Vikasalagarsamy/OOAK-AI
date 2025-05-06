"use client"

import type React from "react"

import {
  LayoutDashboard,
  Users,
  User,
  Building,
  Building2,
  GitBranch,
  Shield,
  Briefcase,
  BadgeCheck,
  Settings,
  TrendingUp,
  FilePlus,
  ListChecks,
  List,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Globe,
  Menu,
  Bug,
  CircleHelp,
} from "lucide-react"

export interface MenuIconProps {
  name: string
  className?: string
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Users,
  User,
  Building,
  Building2,
  GitBranch,
  Shield,
  Briefcase,
  BadgeCheck,
  Settings,
  TrendingUp,
  FilePlus,
  ListChecks,
  List,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Globe,
  Menu,
  Bug,
}

export function MenuIcon({ name, className }: MenuIconProps) {
  const Icon = iconMap[name] || CircleHelp

  return <Icon className={className} />
}
