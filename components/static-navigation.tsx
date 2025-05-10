"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronDown, LogOut, User, Settings, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState, useRef, useEffect } from "react"
import { getMenuIcon } from "@/components/dynamic-menu/get-menu-icon"
import { useRole } from "@/contexts/role-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function StaticNavigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const dropdownRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Get role-based menu
  const { currentRole, filteredMenu, availableRoles, setCurrentRole, isAdmin } = useRole()

  // Check if we're on an auth page
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/logout" ||
    pathname === "/register" ||
    pathname?.includes("?reason=unauthenticated")

  // Handle mouse enter for dropdown
  const handleMouseEnter = (menuName: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
      dropdownTimeoutRef.current = null
    }
    setActiveDropdown(menuName)
  }

  // Handle mouse leave for dropdown
  const handleMouseLeave = () => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }

    // Add a small delay before closing to prevent accidental closures
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null)
    }, 150)
  }

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeDropdown) {
        const dropdownElement = dropdownRefs.current[activeDropdown]
        if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
          setActiveDropdown(null)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [activeDropdown])

  // Don't render the navigation on auth pages
  if (isAuthPage) {
    return null
  }

  // Convert the filtered menu structure to an array for easier mapping
  const mainMenuItems = Object.entries(filteredMenu).map(([name, item]) => ({
    name,
    ...item,
  }))

  return (
    <nav className="bg-background border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex-shrink-0">
            <Link href="/dashboard" className="font-bold text-lg">
              ONE OF A KIND PORTAL
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dynamic Menu Items */}
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/")
              const hasSubMenus = item.subMenus && item.subMenus.length > 0
              const isDropdownActive = activeDropdown === item.name

              return (
                <div
                  key={item.name}
                  className="relative"
                  onMouseEnter={() => hasSubMenus && handleMouseEnter(item.name)}
                  onMouseLeave={handleMouseLeave}
                  ref={(el) => (dropdownRefs.current[item.name] = el)}
                >
                  <Link
                    href={item.path || "#"}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                      isActive || isDropdownActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={(e) => {
                      if (!item.path && hasSubMenus) {
                        e.preventDefault()
                      }
                      if (hasSubMenus) {
                        setActiveDropdown(activeDropdown === item.name ? null : item.name)
                      }
                    }}
                  >
                    {getMenuIcon(item.icon)}
                    <span className="mx-1">{item.name}</span>
                    {hasSubMenus && <ChevronDown className="h-4 w-4 ml-1" />}
                  </Link>

                  {/* Dropdown Menu */}
                  {hasSubMenus && (
                    <div
                      className={cn(
                        "absolute left-0 mt-1 w-56 rounded-md shadow-lg bg-popover border border-border overflow-hidden z-50 transition-all duration-200 ease-in-out",
                        isDropdownActive
                          ? "opacity-100 translate-y-0 pointer-events-auto"
                          : "opacity-0 translate-y-1 pointer-events-none",
                      )}
                    >
                      <div className="py-1">
                        {item.subMenus.map((subItem) => (
                          <Link
                            key={subItem.name}
                            href={subItem.path}
                            className={cn(
                              "flex items-center px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                              pathname === subItem.path && "bg-accent/50 text-accent-foreground",
                            )}
                            onClick={() => setActiveDropdown(null)}
                          >
                            {getMenuIcon(subItem.icon)}
                            <span className="ml-2">{subItem.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* User Profile and Role Selector */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Role Selector (for testing purposes) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  {isAdmin ? <Shield className="h-4 w-4 text-blue-500" /> : <User className="h-4 w-4" />}
                  <span>{currentRole.name}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Role (Testing)</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {availableRoles.map((role) => (
                  <DropdownMenuItem
                    key={role.id}
                    onClick={() => setCurrentRole(role)}
                    className={cn("cursor-pointer", currentRole.id === role.id && "bg-accent text-accent-foreground")}
                  >
                    {role.isAdmin ? (
                      <Shield className="mr-2 h-4 w-4 text-blue-500" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    {role.name}
                    {role.isAdmin && <Settings className="ml-auto h-4 w-4" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link
              href="/logout"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-t">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {mainMenuItems.map((item) => {
              const isActive = pathname === item.path || pathname.startsWith(item.path + "/")
              const hasSubMenus = item.subMenus && item.subMenus.length > 0

              return (
                <div key={item.name} className="py-1">
                  <Link
                    href={item.path || "#"}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-base font-medium w-full",
                      isActive
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                    onClick={(e) => {
                      if (!item.path && hasSubMenus) {
                        e.preventDefault()
                      } else {
                        setMobileMenuOpen(false)
                      }
                    }}
                  >
                    {getMenuIcon(item.icon)}
                    <span className="ml-2">{item.name}</span>
                    {hasSubMenus && <ChevronDown className="h-4 w-4 ml-2" />}
                  </Link>

                  {hasSubMenus && (
                    <div className="pl-6 mt-1 space-y-1">
                      {item.subMenus.map((subItem) => (
                        <Link
                          key={subItem.name}
                          href={subItem.path}
                          className={cn(
                            "flex items-center px-3 py-2 rounded-md text-sm font-medium",
                            pathname === subItem.path
                              ? "bg-accent text-accent-foreground"
                              : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {getMenuIcon(subItem.icon)}
                          <span className="ml-2">{subItem.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Mobile Role Selector */}
            <div className="py-2 px-3">
              <div className="text-sm font-medium text-foreground/70 mb-2">Current Role (Testing)</div>
              <div className="space-y-1">
                {availableRoles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setCurrentRole(role)}
                    className={cn(
                      "flex items-center px-3 py-2 rounded-md text-sm font-medium w-full",
                      currentRole.id === role.id
                        ? "bg-accent text-accent-foreground"
                        : "text-foreground hover:bg-accent hover:text-accent-foreground",
                    )}
                  >
                    {role.isAdmin ? (
                      <Shield className="mr-2 h-4 w-4 text-blue-500" />
                    ) : (
                      <User className="mr-2 h-4 w-4" />
                    )}
                    {role.name}
                    {role.isAdmin && <Settings className="ml-auto h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Logout */}
            <div className="py-1">
              <Link
                href="/logout"
                className="flex items-center px-3 py-2 rounded-md text-base font-medium w-full text-foreground hover:bg-accent hover:text-accent-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
