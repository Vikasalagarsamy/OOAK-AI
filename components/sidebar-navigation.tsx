"use client"

import type React from "react"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Building2,
  Users,
  BarChart,
  UserCog,
  Briefcase,
  Building,
  PieChart,
  GitBranch,
  TrendingUp,
  Settings,
  Calendar,
  MapPin,
  ClipboardList,
  FileText,
  DollarSign,
  Clock,
  AlertCircle,
  Activity,
  FileSearch,
  Shield,
  Video,
  Package,
  BarChart3,
  CheckCircle,
  CreditCard,
  Phone,
  History,
  Loader2,
  Target,
  Bot,
  RefreshCw,
  Eye,
  PieChart as PieChartIcon
} from "lucide-react"
import { extractMenuStructure, type PermissionMenuItem } from "@/lib/menu-extractor"
import { filterMenuByPermissions } from "@/lib/permission-checker"
import { getCurrentUser } from "@/actions/auth-actions"

type MenuItem = {
  title: string
  href?: string
  icon: React.ReactNode
  submenu?: {
    title: string
    href: string
    icon: React.ReactNode
    description?: string
  }[]
}

// Cache for menu data - avoid re-fetching on every navigation
let menuCache: {
  user: any | null
  menuItems: PermissionMenuItem[]
  timestamp: number
  userId: string
} | null = null

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000

// Function to clear cache (export for use when user logs out/changes)
export const clearSidebarCache = () => {
  menuCache = null
  console.log("🗑️ Sidebar cache cleared")
}

// Icon mapping for menu items (memoized)
const getIconForSection = (sectionId: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    dashboard: <LayoutDashboard className="h-5 w-5" />,
    organization: <Building2 className="h-5 w-5" />,
    people: <Users className="h-5 w-5" />,
    sales: <DollarSign className="h-5 w-5" />,
    tasks: <Target className="h-5 w-5" />,
    accounting: <CreditCard className="h-5 w-5" />,
    'post-sales': <Phone className="h-5 w-5" />,
    events: <Calendar className="h-5 w-5" />,
    production: <Video className="h-5 w-5" />,
    reports: <BarChart className="h-5 w-5" />,
    audit: <Shield className="h-5 w-5" />,
    admin: <Settings className="h-5 w-5" />,
    'follow-ups': <Clock className="h-5 w-5" />,
  }
  return iconMap[sectionId] || <FileText className="h-5 w-5" />
}

const getIconForChild = (childId: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    // Organization children
    'organization-companies': <Building className="h-4 w-4" />,
    'organization-branches': <Building2 className="h-4 w-4" />,
    'organization-clients': <Briefcase className="h-4 w-4" />,
    'organization-suppliers': <Package className="h-4 w-4" />,
    'organization-vendors': <Briefcase className="h-4 w-4" />,
    'organization-roles': <UserCog className="h-4 w-4" />,
    'organization-user-accounts': <Users className="h-4 w-4" />,
    'organization-account-creation': <UserCog className="h-4 w-4" />,
    
    // People children
    'people-dashboard': <LayoutDashboard className="h-4 w-4" />,
    'people-employees': <Users className="h-4 w-4" />,
    'people-departments': <Building className="h-4 w-4" />,
    'people-designations': <UserCog className="h-4 w-4" />,
    
    // Sales children
    'sales-dashboard': <LayoutDashboard className="h-4 w-4" />,
    'sales-create-lead': <FileText className="h-4 w-4" />,
    'sales-my-leads': <ClipboardList className="h-4 w-4" />,
    'sales-unassigned-lead': <AlertCircle className="h-4 w-4" />,
    'sales-lead-sources': <GitBranch className="h-4 w-4" />,
    'sales-follow-up': <Clock className="h-4 w-4" />,
    'sales-quotations': <FileText className="h-4 w-4" />,
    'sales-approvals': <CheckCircle className="h-4 w-4" />,
    'sales-order-confirmation': <FileText className="h-4 w-4" />,
    'sales-rejected-leads': <AlertCircle className="h-4 w-4" />,
    'sales-ai-insights': <Activity className="h-4 w-4" />,
    
    // Tasks children
    'tasks-dashboard': <Target className="h-4 w-4" />,
    'tasks-admin': <Settings className="h-4 w-4" />,
    'tasks-ai-generator': <Bot className="h-4 w-4" />,
    'tasks-migration': <RefreshCw className="h-4 w-4" />,
    'tasks-analytics': <BarChart3 className="h-4 w-4" />,
    'tasks-calendar': <Calendar className="h-4 w-4" />,
    'tasks-reports': <FileText className="h-4 w-4" />,
    
    // Accounting children
    'accounting-payments': <CreditCard className="h-4 w-4" />,
    
    // Post-Sales children
    'post-sales-confirmations': <Phone className="h-4 w-4" />,
    
    // Events children
    'events-calendar': <Calendar className="h-4 w-4" />,
    'events-list': <Calendar className="h-4 w-4" />,
    'events-venues': <MapPin className="h-4 w-4" />,
    'events-staff': <Users className="h-4 w-4" />,
    
    // Production children
    'production-timeline': <Activity className="h-4 w-4" />,
    'production-assets': <Package className="h-4 w-4" />,
    'production-delivery': <Package className="h-4 w-4" />,
    
    // Reports children
    'reports-lead-sources': <GitBranch className="h-4 w-4" />,
    'reports-conversion-funnel': <TrendingUp className="h-4 w-4" />,
    'reports-team-performance': <Users className="h-4 w-4" />,
    'reports-trends': <TrendingUp className="h-4 w-4" />,
    'reports-custom': <FileText className="h-4 w-4" />,
    'reports-workflow-history': <History className="h-4 w-4" />,
    
    // Audit children
    'audit-activity-logs': <ClipboardList className="h-4 w-4" />,
    'audit-employee-audit': <FileSearch className="h-4 w-4" />,
    
    // Admin children
    'admin-migration': <Settings className="h-4 w-4" />,
    'admin-templates': <FileText className="h-4 w-4" />,
    'admin-menu-permissions': <Shield className="h-4 w-4" />,
    'admin-system-settings': <Settings className="h-4 w-4" />,
    
    // Follow-ups children
    'follow-ups-pending': <Clock className="h-4 w-4" />,
    'follow-ups-completed': <CheckCircle className="h-4 w-4" />,
  }
  return iconMap[childId] || <FileText className="h-4 w-4" />
}

export function SidebarNavigation() {
  const [openMenu, setOpenMenu] = useState<string | null>('sales') // Only one menu can be open at a time
  const [filteredMenuItems, setFilteredMenuItems] = useState<PermissionMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<string>("")
  const pathname = usePathname()

  // Simple cache check function (no async operations)
  const hasValidCache = useCallback(() => {
    if (!menuCache) return false
    const now = Date.now()
    return (now - menuCache.timestamp) < CACHE_DURATION
  }, [])

  // Load menu items filtered by user permissions (with immediate cache loading)
  useEffect(() => {
    const loadFilteredMenu = async () => {
      try {
        // IMMEDIATE cache check - no async operations
        if (hasValidCache() && menuCache) {
          console.log("⚡ Instantly loading from cache")
          setUserInfo(`${menuCache.user?.username} (${menuCache.user?.roleName})`)
          setFilteredMenuItems(menuCache.menuItems)
          setLoading(false)
          
          // Background validation (don't await this)
          validateUserInBackground()
          return
        }

        console.log("🔄 Loading fresh menu data...")
        await loadFreshMenuData()
      } catch (error) {
        console.error("❌ Error loading filtered menu:", error)
        setFallbackMenu()
      }
    }

    // Background user validation (doesn't affect immediate loading)
    const validateUserInBackground = async () => {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser?.id !== menuCache?.userId) {
          console.log("👤 User changed in background, refreshing...")
          await loadFreshMenuData()
        }
      } catch (error) {
        console.log("🔍 Background validation failed, keeping cache")
      }
    }

    // Load fresh data
    const loadFreshMenuData = async () => {
      setLoading(true)
      
      const user = await getCurrentUser()
      if (user) {
        setUserInfo(`${user.username} (${user.roleName})`)
      }

      const allMenuItems = extractMenuStructure()
      const filtered = await filterMenuByPermissions(allMenuItems)
      
      // Update cache
      menuCache = {
        user,
        menuItems: filtered,
        timestamp: Date.now(),
        userId: user?.id || ""
      }
      
      console.log("✅ Menu loaded and cached:", filtered.length, "sections")
      setFilteredMenuItems(filtered)
      setLoading(false)
    }

    // Set fallback menu
    const setFallbackMenu = () => {
      const fallbackMenu = [{
        id: 'dashboard',
        name: 'Dashboard',
        path: '/dashboard',
        description: 'Main dashboard'
      }]
      setFilteredMenuItems(fallbackMenu)
      setLoading(false)
    }

    loadFilteredMenu()
  }, [hasValidCache]) // Only depend on simple cache check

  // Accordion-style toggle function - only one menu can be open at a time
  const toggleMenu = useCallback((menuId: string) => {
    setOpenMenu(prevOpenMenu => {
      // If clicking the same menu that's already open, close it
      if (prevOpenMenu === menuId) {
        return null
      }
      // Otherwise, open the clicked menu (this closes any other open menu)
      return menuId
    })
  }, [])

  // Show cached content immediately, only show loading for truly fresh loads
  if (loading && !hasValidCache()) {
    return (
      <div className="w-64 h-full bg-background border-r">
        <div className="p-4">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading menu...</span>
          </div>
        </div>
      </div>
    )
  }

  if (filteredMenuItems.length === 0 && !loading) {
    return (
      <div className="w-64 h-full bg-background border-r">
        <div className="p-4">
          <div className="text-center py-8">
            <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No menu access</p>
            <p className="text-xs text-muted-foreground mt-1">Contact administrator</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 h-full bg-background border-r">
      <ScrollArea className="h-full">
        <div className="p-4">
          {/* User info banner */}
          {userInfo && (
            <div className="mb-4 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
              <div className="font-medium">Logged in as:</div>
              <div>{userInfo}</div>
            </div>
          )}

          <nav className="space-y-2">
            {filteredMenuItems.map((section) => {
              const hasChildren = section.children && section.children.length > 0
              const isOpen = openMenu === section.id
              const isActive = pathname === section.path || 
                              (section.children?.some(child => pathname === child.path))

              if (!hasChildren && section.path) {
                // Simple menu item without children
                return (
                  <Link
                    key={section.id}
                    href={section.path}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {getIconForSection(section.id)}
                    {section.name}
                  </Link>
                )
              }

              // Menu item with children - accordion style
              return (
                <div key={section.id}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-3 font-medium transition-all duration-200",
                      isActive && "bg-muted",
                      isOpen && "bg-muted/70"
                    )}
                    onClick={() => toggleMenu(section.id)}
                  >
                    {getIconForSection(section.id)}
                    <span className="flex-1 text-left">{section.name}</span>
                    {hasChildren && (
                      <>
                        <Badge variant="secondary" className="text-xs">
                          {section.children?.length}
                        </Badge>
                        <ChevronDown 
                          className={cn(
                            "h-4 w-4 transition-transform duration-200",
                            isOpen ? "rotate-180" : "rotate-0"
                          )} 
                        />
                      </>
                    )}
                  </Button>

                  {hasChildren && isOpen && (
                    <div className="ml-4 mt-1 space-y-1 border-l border-border pl-4 pb-2 animate-in slide-in-from-top-2 duration-300">
                      {section.children?.map((child) => {
                        const isChildActive = pathname === child.path
                        return (
                          <Link
                            key={child.id}
                            href={child.path}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                              isChildActive
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                          >
                            {getIconForChild(child.id)}
                            <div className="flex-1">
                              <div className="font-medium">{child.name}</div>
                              {child.description && (
                                <div className="text-xs text-muted-foreground">
                                  {child.description}
                                </div>
                              )}
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </ScrollArea>
    </div>
  )
}
