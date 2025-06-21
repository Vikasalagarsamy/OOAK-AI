"use client"


import Link from 'next/link'
import { Target, Bot, RefreshCw, BarChart3 } from 'lucide-react'

export function TaskManagementLinks() {
  return (
    <div className="border-t border-gray-200 pt-4 mt-4">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        🚀 AI Task Management
      </h3>
      
      <div className="space-y-2">
        <Link 
          href="/tasks/dashboard" 
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Target className="w-4 h-4 mr-3" />
          <span>My Tasks</span>
          <span className="ml-auto px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">NEW</span>
        </Link>
        
        <Link 
          href="/admin/task-management" 
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <BarChart3 className="w-4 h-4 mr-3" />
          <span>Admin Tasks</span>
          <span className="ml-auto px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">ADMIN</span>
        </Link>
        
        <Link 
          href="/test-ai-task-system.html" 
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <Bot className="w-4 h-4 mr-3" />
          <span>AI Generator</span>
          <span className="ml-auto px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">AI</span>
        </Link>
        
        <Link 
          href="/followup-to-task-migration.html" 
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4 mr-3" />
          <span>Migration</span>
          <span className="ml-auto px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">MIGRATE</span>
        </Link>
      </div>
      
      <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <p className="text-xs text-gray-600 mb-2">🎯 <strong>Quick Access</strong></p>
        <div className="space-y-1">
          <Link href="/navigation" className="block text-xs text-blue-600 hover:text-blue-800">
            → Complete Navigation
          </Link>
          <Link href="/feature-checklist.html" className="block text-xs text-green-600 hover:text-green-800">
            → Feature Checklist
          </Link>
        </div>
      </div>
    </div>
  )
} 