"use client"

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { 
  ChevronDown, 
  ChevronRight, 
  Home,
  DollarSign,
  Building2,
  Users,
  CheckSquare,
  Calendar,
  Film,
  Handshake,
  PieChart,
  Settings,
  LayoutGrid,
  BarChart,
  Cpu,
  UserPlus,
  UserMinus,
  PhoneCall,
  FileText,
  Clock,
  X,
  Check,
  XCircle,
  Globe,
  Brain,
  Phone,
  TrendingUp,
  Filter,
  Building,
  GitBranch,
  Truck,
  Store,
  Shield,
  User,
  Menu,
  Grid,
  Award,
  List,
  Command,
  Receipt,
  CreditCard,
  Star,
  Tag,
  Wrench,
  MapPin,
  Package,
  Folder,
  Shuffle,
  CheckCircle,
  Eye,
  Send,
  Headphones,
  MessageSquare,
  LineChart,
  Link2,
  BarChart2,
  RefreshCw
} from 'lucide-react'
import { MenuItem } from './menu-system/menu-data'

// Icon mapping for dynamic icon rendering
const iconMap = {
  Home, DollarSign, Building2, Users, CheckSquare, Calendar, Film, Handshake, 
  PieChart, Settings, LayoutGrid, BarChart, Cpu, UserPlus, UserMinus, PhoneCall, 
  FileText, Clock, X, Check, XCircle, Globe, Brain, Phone, TrendingUp, Filter,
  Building, GitBranch, Truck, Store, Shield, User, Menu, Grid, Award, List,
  Command, Receipt, CreditCard, Star, Tag, Tool: Wrench, MapPin, Package, Folder,
  Shuffle, CheckCircle, Eye, Send, Headphones, MessageSquare, LineChart,
  Link2, BarChart2, RefreshCw
}

interface SidebarNavigationProps {
  className?: string
}

interface FilteredMenuResponse {
  success: boolean
  menu: MenuItem[]
  user: {
    roleId: number
    roleName: string
    isAdmin: boolean
  } | null
  message?: string
}

export default function SidebarNavigation({ className = "" }: SidebarNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<{roleId: number, roleName: string, isAdmin: boolean} | null>(null)

  // Load filtered menu based on user role
  const loadFilteredMenu = async () => {
    try {
      console.log('🔄 Loading role-based menu...')
      setLoading(true)
      
      const response = await fetch('/api/menu/filtered')
      const data: FilteredMenuResponse = await response.json()
      
      if (data.success) {
        setMenuItems(data.menu)
        setCurrentUser(data.user)
        console.log(`✅ Loaded ${data.menu.length} menu items for role: ${data.user?.roleName || 'Guest'}`)
      } else {
        console.error('❌ Failed to load filtered menu:', data)
        // Fallback to minimal menu
        setMenuItems([
          {
            id: 1,
            name: "Dashboard",
            description: "Access dashboard",
            icon: "Home",
            path: "/dashboard",
            string_id: "dashboard",
            is_visible: true,
            is_admin_only: false,
            badge_variant: "secondary",
            is_new: false,
            category: "primary",
            sort_order: 1
          }
        ])
      }
    } catch (error) {
      console.error('❌ Error loading filtered menu:', error)
      // Fallback to basic menu
      setMenuItems([
        {
          id: 1,
          name: "Dashboard",
          description: "Access dashboard",
          icon: "Home",
          path: "/dashboard",
          string_id: "dashboard",
          is_visible: true,
          is_admin_only: false,
          badge_variant: "secondary",
          is_new: false,
          category: "primary",
          sort_order: 1
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  // Load menu on component mount
  useEffect(() => {
    loadFilteredMenu()
  }, [])

  const toggleExpanded = (itemId: number) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true
    if (path !== '/dashboard' && pathname.startsWith(path)) return true
    return false
  }

  const renderIcon = (iconName: string, className: string = "h-4 w-4") => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    if (!IconComponent) return <Home className={className} />
    return <IconComponent className={className} />
  }

  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = expandedItems.includes(item.id)
    const isItemActive = isActive(item.path)

    if (!item.is_visible) return null

    return (
      <div key={item.id} className="w-full">
        <div
          className={`
            flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors
            ${level > 0 ? 'ml-4' : ''}
            ${isItemActive 
              ? 'bg-blue-100 text-blue-900 font-medium' 
              : 'text-gray-700 hover:bg-gray-100'
            }
          `}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id)
            } else {
              router.push(item.path)
            }
          }}
        >
          <div className="flex items-center gap-3">
            {renderIcon(item.icon)}
            <span className="font-medium">{item.name}</span>
            {item.badge_text && (
              <span className={`
                px-2 py-1 text-xs rounded-full
                ${item.badge_variant === 'secondary' 
                  ? 'bg-gray-200 text-gray-700' 
                  : 'bg-blue-200 text-blue-700'
                }
              `}>
                {item.badge_text}
              </span>
            )}
            {item.is_new && (
              <span className="px-2 py-1 text-xs bg-green-200 text-green-700 rounded-full">
                New
              </span>
            )}
          </div>
          
          {hasChildren && (
            <div className="transition-transform duration-200">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
        <div className="p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            OOAK Enterprise
          </h2>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span className="ml-2 text-sm text-gray-600">Loading menu...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white shadow-sm border-r border-gray-200 ${className}`}>
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          OOAK Enterprise
        </h2>
        
        <nav className="space-y-2">
          {menuItems.length > 0 ? (
            menuItems.map(item => renderMenuItem(item))
          ) : (
            <div className="text-center py-4 text-gray-500 text-sm">
              No menu items available
            </div>
          )}
        </nav>
      </div>
    </div>
  )
} 