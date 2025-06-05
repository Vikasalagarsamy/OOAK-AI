"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Target, Bot, RefreshCw, BarChart3, X, Plus } from 'lucide-react'

export function TaskManagementFAB() {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-20" 
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Menu Items */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 space-y-2">
          <Link 
            href="/tasks/dashboard"
            className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 min-w-48"
            onClick={() => setIsOpen(false)}
          >
            <Target className="w-5 h-5 mr-3" />
            <span className="font-medium">My Tasks Dashboard</span>
          </Link>
          
          <Link 
            href="/admin/task-management"
            className="flex items-center bg-purple-500 hover:bg-purple-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 min-w-48"
            onClick={() => setIsOpen(false)}
          >
            <BarChart3 className="w-5 h-5 mr-3" />
            <span className="font-medium">Admin Control Center</span>
          </Link>
          
          <Link 
            href="/test-ai-task-system.html"
            className="flex items-center bg-green-500 hover:bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 min-w-48"
            onClick={() => setIsOpen(false)}
          >
            <Bot className="w-5 h-5 mr-3" />
            <span className="font-medium">AI Task Generator</span>
          </Link>
          
          <Link 
            href="/followup-to-task-migration.html"
            className="flex items-center bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg shadow-lg transition-all transform hover:scale-105 min-w-48"
            onClick={() => setIsOpen(false)}
          >
            <RefreshCw className="w-5 h-5 mr-3" />
            <span className="font-medium">Migration Panel</span>
          </Link>
          
          <div className="bg-white rounded-lg shadow-lg p-3 border">
            <p className="text-xs text-gray-600 mb-2 font-semibold">🚀 More Features</p>
            <div className="space-y-1">
              <Link 
                href="/navigation" 
                className="block text-xs text-blue-600 hover:text-blue-800"
                onClick={() => setIsOpen(false)}
              >
                → Complete Navigation
              </Link>
              <Link 
                href="/feature-checklist.html" 
                className="block text-xs text-green-600 hover:text-green-800"
                onClick={() => setIsOpen(false)}
              >
                → Feature Checklist
              </Link>
            </div>
          </div>
        </div>
      )}
      
      {/* FAB Button */}
      <button
        onClick={toggleMenu}
        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-110 flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Target className="w-6 h-6" />}
      </button>
      
      {/* Label */}
      {!isOpen && (
        <div className="absolute bottom-0 right-16 mb-4 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
          Task Management
        </div>
      )}
    </div>
  )
} 