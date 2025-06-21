"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  Users, 
  Settings, 
  BarChart3, 
  Bot, 
  RefreshCw, 
  Bell, 
  FileText, 
  Shield, 
  Database,
  HelpCircle,
  Zap,
  Target,
  TrendingUp,
  Calendar,
  MessageSquare,
  Download,
  Upload,
  Eye,
  Clock,
  ChevronDown,
  ChevronRight,
  Phone
} from 'lucide-react'

interface NavigationItem {
  title: string
  icon: React.ReactNode
  href?: string
  badge?: string
  subItems?: NavigationItem[]
}

const navigationStructure: NavigationItem[] = [
  {
    title: "🏠 Home Dashboard",
    icon: <Home className="w-5 h-5" />,
    href: "/",
    subItems: [
      { title: "Business Overview", icon: <BarChart3 className="w-4 h-4" />, href: "/" },
      { title: "Quick Actions", icon: <Zap className="w-4 h-4" />, href: "/quick-actions" },
      { title: "Recent Activity", icon: <Clock className="w-4 h-4" />, href: "/activity" }
    ]
  },
  {
    title: "👥 Employee Portal",
    icon: <Users className="w-5 h-5" />,
    href: "/tasks/dashboard",
    badge: "NEW",
    subItems: [
      { title: "My Tasks Dashboard", icon: <Target className="w-4 h-4" />, href: "/tasks/dashboard" },
      { title: "Task Assignment", icon: <Users className="w-4 h-4" />, href: "/tasks/assigned" },
      { title: "My Performance", icon: <TrendingUp className="w-4 h-4" />, href: "/tasks/performance" },
      { title: "Task History", icon: <Clock className="w-4 h-4" />, href: "/tasks/history" },
      { title: "Calendar View", icon: <Calendar className="w-4 h-4" />, href: "/tasks/calendar" },
      { title: "Quick Actions", icon: <Zap className="w-4 h-4" />, href: "/tasks/quick-actions" }
    ]
  },
  {
    title: "⚡ Admin Control Center",
    icon: <Shield className="w-5 h-5" />,
    href: "/tasks/admin",
    badge: "ADMIN",
    subItems: [
      { title: "Team Task Overview", icon: <Target className="w-4 h-4" />, href: "/admin/task-management" },
      { title: "Task Assignment Management", icon: <Users className="w-4 h-4" />, href: "/admin/assignments" },
      { title: "Escalation Management", icon: <TrendingUp className="w-4 h-4" />, href: "/admin/escalations" },
      { title: "Performance Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/admin/analytics" },
      { title: "Revenue Tracking", icon: <TrendingUp className="w-4 h-4" />, href: "/admin/revenue" },
      { title: "Team Performance", icon: <Users className="w-4 h-4" />, href: "/admin/team-performance" },
      { title: "Business Rules", icon: <Settings className="w-4 h-4" />, href: "/admin/business-rules" }
    ]
  },
  {
    title: "🤖 AI Task Generator",
    icon: <Bot className="w-5 h-5" />,
    href: "/test-ai-task-system.html",
    badge: "AI",
    subItems: [
      { title: "Generate New Tasks", icon: <Bot className="w-4 h-4" />, href: "/test-ai-task-system.html" },
      { title: "View Generated Tasks", icon: <Eye className="w-4 h-4" />, href: "/ai-tasks/view" },
      { title: "Business Rules Testing", icon: <Settings className="w-4 h-4" />, href: "/ai-tasks/rules-test" },
      { title: "Task Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/ai-tasks/analytics" },
      { title: "AI Insights", icon: <Bot className="w-4 h-4" />, href: "/ai-tasks/insights" },
      { title: "Performance Metrics", icon: <TrendingUp className="w-4 h-4" />, href: "/ai-tasks/metrics" }
    ]
  },
  {
    title: "🔄 Migration Control Panel",
    icon: <RefreshCw className="w-5 h-5" />,
    href: "/followup-to-task-migration.html",
    badge: "MIGRATION",
    subItems: [
      { title: "Full Migration", icon: <RefreshCw className="w-4 h-4" />, href: "/followup-to-task-migration.html" },
      { title: "Enhanced Tasks Generation", icon: <Bot className="w-4 h-4" />, href: "/migration/enhanced" },
      { title: "Migration Reports", icon: <FileText className="w-4 h-4" />, href: "/migration/reports" },
      { title: "Business Rules Config", icon: <Settings className="w-4 h-4" />, href: "/migration/rules" },
      { title: "Legacy System Analysis", icon: <Eye className="w-4 h-4" />, href: "/migration/analysis" }
    ]
  },
  {
    title: "📊 Reports & Analytics",
    icon: <BarChart3 className="w-5 h-5" />,
    subItems: [
      { title: "Call Analytics Dashboard", icon: <Phone className="w-4 h-4" />, href: "/call-monitoring" },
      { title: "Business Intelligence", icon: <BarChart3 className="w-4 h-4" />, href: "/reports/business-intelligence" },
      { title: "Task Performance Reports", icon: <Target className="w-4 h-4" />, href: "/reports/task-performance" },
      { title: "Revenue Analytics", icon: <TrendingUp className="w-4 h-4" />, href: "/reports/revenue" },
      { title: "Employee Performance", icon: <Users className="w-4 h-4" />, href: "/reports/employee" },
      { title: "Client Analytics", icon: <Users className="w-4 h-4" />, href: "/reports/clients" },
      { title: "Workflow Analytics", icon: <RefreshCw className="w-4 h-4" />, href: "/reports/workflow" },
      { title: "Export Data", icon: <Download className="w-4 h-4" />, href: "/reports/export" }
    ]
  },
  {
    title: "🔔 Notification Center",
    icon: <Bell className="w-5 h-5" />,
    href: "/notifications",
    subItems: [
      { title: "All Notifications", icon: <Bell className="w-4 h-4" />, href: "/notifications" },
      { title: "Task Alerts", icon: <Target className="w-4 h-4" />, href: "/notifications/tasks" },
      { title: "System Alerts", icon: <Shield className="w-4 h-4" />, href: "/notifications/system" },
      { title: "Revenue Alerts", icon: <TrendingUp className="w-4 h-4" />, href: "/notifications/revenue" },
      { title: "Notification Settings", icon: <Settings className="w-4 h-4" />, href: "/notifications/settings" }
    ]
  },
  {
    title: "⚙️ System Settings",
    icon: <Settings className="w-5 h-5" />,
    subItems: [
      { title: "General Settings", icon: <Settings className="w-4 h-4" />, href: "/settings/general" },
      { title: "User Management", icon: <Users className="w-4 h-4" />, href: "/settings/users" },
      { title: "Role Permissions", icon: <Shield className="w-4 h-4" />, href: "/settings/permissions" },
      { title: "API Configuration", icon: <Database className="w-4 h-4" />, href: "/settings/api" },
      { title: "Integration Center", icon: <RefreshCw className="w-4 h-4" />, href: "/settings/integrations" },
      { title: "Backup & Export", icon: <Download className="w-4 h-4" />, href: "/settings/backup" }
    ]
  },
  {
    title: "📈 System Health",
    icon: <TrendingUp className="w-5 h-5" />,
    href: "/system/health",
    subItems: [
      { title: "Health Dashboard", icon: <TrendingUp className="w-4 h-4" />, href: "/system/health" },
      { title: "Performance Monitoring", icon: <BarChart3 className="w-4 h-4" />, href: "/system/performance" },
      { title: "Error Logs", icon: <FileText className="w-4 h-4" />, href: "/system/logs" },
      { title: "Audit Trail", icon: <Eye className="w-4 h-4" />, href: "/system/audit" },
      { title: "Database Status", icon: <Database className="w-4 h-4" />, href: "/system/database" }
    ]
  },
  {
    title: "❓ Help & Support",
    icon: <HelpCircle className="w-5 h-5" />,
    subItems: [
      { title: "User Documentation", icon: <FileText className="w-4 h-4" />, href: "/help/docs" },
      { title: "API Documentation", icon: <Database className="w-4 h-4" />, href: "/help/api" },
      { title: "Video Tutorials", icon: <Eye className="w-4 h-4" />, href: "/help/tutorials" },
      { title: "FAQ", icon: <HelpCircle className="w-4 h-4" />, href: "/help/faq" },
      { title: "Contact Support", icon: <MessageSquare className="w-4 h-4" />, href: "/help/contact" },
      { title: "System Status", icon: <TrendingUp className="w-4 h-4" />, href: "/help/status" }
    ]
  }
]

export function MainNavigation() {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  const toggleExpanded = (title: string) => {
    setExpandedItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const renderNavigationItem = (item: NavigationItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0
    const isExpanded = expandedItems.includes(item.title)
    const itemIsActive = item.href ? isActive(item.href) : false

    return (
      <div key={item.title} className={`${level > 0 ? 'ml-4' : ''}`}>
        <div
          className={`
            flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-200
            ${itemIsActive ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500' : 'hover:bg-gray-100'}
            ${level > 0 ? 'text-sm' : 'font-medium'}
          `}
          onClick={() => {
            if (hasSubItems) {
              toggleExpanded(item.title)
            } else if (item.href) {
              window.location.href = item.href
            }
          }}
        >
          <div className="flex items-center space-x-3">
            {item.icon}
            <span>{item.title}</span>
            {item.badge && (
              <span className={`
                px-2 py-1 text-xs rounded-full font-semibold
                ${item.badge === 'NEW' ? 'bg-green-100 text-green-800' : ''}
                ${item.badge === 'ADMIN' ? 'bg-red-100 text-red-800' : ''}
                ${item.badge === 'AI' ? 'bg-purple-100 text-purple-800' : ''}
                ${item.badge === 'MIGRATION' ? 'bg-blue-100 text-blue-800' : ''}
              `}>
                {item.badge}
              </span>
            )}
          </div>
          {hasSubItems && (
            <div className="transition-transform duration-200">
              {isExpanded ? 
                <ChevronDown className="w-4 h-4" /> : 
                <ChevronRight className="w-4 h-4" />
              }
            </div>
          )}
        </div>

        {hasSubItems && isExpanded && (
          <div className="mt-2 space-y-1">
            {item.subItems!.map(subItem => renderNavigationItem(subItem, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="w-80 bg-white shadow-lg rounded-lg p-6 max-h-screen overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">🚀 Task Management System</h2>
        <p className="text-sm text-gray-600">AI-Powered Business Operations</p>
      </div>

      <div className="space-y-2">
        {navigationStructure.map(item => renderNavigationItem(item))}
      </div>

      <div className="mt-8 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="font-semibold text-gray-700 mb-2">🎯 Quick Access</h3>
        <div className="space-y-2">
          <Link href="/tasks/dashboard" className="block text-sm text-blue-600 hover:text-blue-800">
            → My Tasks
          </Link>
          <Link href="/admin/task-management" className="block text-sm text-purple-600 hover:text-purple-800">
            → Admin Panel
          </Link>
          <Link href="/test-ai-task-system.html" className="block text-sm text-green-600 hover:text-green-800">
            → AI Generator
          </Link>
          <Link href="/followup-to-task-migration.html" className="block text-sm text-orange-600 hover:text-orange-800">
            → Migration Panel
          </Link>
        </div>
      </div>
    </div>
  )
} 