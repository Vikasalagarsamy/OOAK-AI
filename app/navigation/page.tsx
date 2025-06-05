import { MainNavigation } from '@/components/navigation/main-navigation'

export const metadata = {
  title: 'Navigation Control Center - AI Task Management System',
  description: 'Complete navigation and feature overview for the AI-powered task management system',
}

export default function NavigationPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🧭 Navigation Control Center
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Complete overview of your AI-powered task management system
          </p>
          <div className="bg-gradient-to-r from-green-100 to-blue-100 rounded-lg p-6 mx-auto max-w-4xl">
            <h2 className="text-2xl font-semibold text-gray-700 mb-3">🚀 System Status</h2>
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">✅</div>
                <h3 className="font-semibold text-gray-700">System Ready</h3>
                <p className="text-sm text-gray-600">All features operational</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">🤖</div>
                <h3 className="font-semibold text-gray-700">AI Powered</h3>
                <p className="text-sm text-gray-600">Intelligent automation active</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">📊</div>
                <h3 className="font-semibold text-gray-700">Analytics Ready</h3>
                <p className="text-sm text-gray-600">Real-time insights available</p>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">🔄</div>
                <h3 className="font-semibold text-gray-700">Migration Complete</h3>
                <p className="text-sm text-gray-600">Task-based workflow active</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Panel */}
          <div className="lg:w-1/3">
            <MainNavigation />
          </div>

          {/* Feature Overview */}
          <div className="lg:w-2/3 space-y-8">
            {/* Core Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🎯 Core Features</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">👥</div>
                    <h3 className="text-lg font-semibold text-gray-800">Employee Portal</h3>
                    <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">NEW</span>
                  </div>
                  <p className="text-gray-600 mb-4">Personal task dashboard with AI-powered assignment and tracking</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• My Tasks Dashboard</li>
                    <li>• Performance Metrics</li>
                    <li>• Calendar View</li>
                    <li>• Quick Actions</li>
                  </ul>
                  <a href="/tasks/dashboard" className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
                    Access Portal →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">⚡</div>
                    <h3 className="text-lg font-semibold text-gray-800">Admin Control Center</h3>
                    <span className="ml-2 px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">ADMIN</span>
                  </div>
                  <p className="text-gray-600 mb-4">Complete oversight of team tasks, performance, and revenue protection</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Team Task Overview</li>
                    <li>• Escalation Management</li>
                    <li>• Revenue Tracking</li>
                    <li>• Performance Analytics</li>
                  </ul>
                  <a href="/admin/task-management" className="inline-block mt-4 bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition">
                    Access Admin Panel →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">🤖</div>
                    <h3 className="text-lg font-semibold text-gray-800">AI Task Generator</h3>
                    <span className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">AI</span>
                  </div>
                  <p className="text-gray-600 mb-4">Intelligent task generation with business rules and revenue impact</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Smart Task Generation</li>
                    <li>• Business Rules Testing</li>
                    <li>• AI Insights</li>
                    <li>• Performance Metrics</li>
                  </ul>
                  <a href="/test-ai-task-system.html" className="inline-block mt-4 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
                    Generate Tasks →
                  </a>
                </div>

                <div className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-center mb-4">
                    <div className="text-3xl mr-3">🔄</div>
                    <h3 className="text-lg font-semibold text-gray-800">Migration Control</h3>
                    <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">MIGRATION</span>
                  </div>
                  <p className="text-gray-600 mb-4">Transform followups to intelligent tasks with comprehensive migration tools</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Full Migration</li>
                    <li>• Enhanced Task Generation</li>
                    <li>• Migration Reports</li>
                    <li>• Business Rules Config</li>
                  </ul>
                  <a href="/followup-to-task-migration.html" className="inline-block mt-4 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition">
                    Migrate System →
                  </a>
                </div>
              </div>
            </div>

            {/* Advanced Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🔧 Advanced Features</h2>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">📊</div>
                  <h3 className="font-semibold text-gray-700">Reports & Analytics</h3>
                  <p className="text-sm text-gray-600 mt-2">Comprehensive business intelligence and performance tracking</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">🔔</div>
                  <h3 className="font-semibold text-gray-700">Notification Center</h3>
                  <p className="text-sm text-gray-600 mt-2">Smart alerts and notifications for critical business events</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">⚙️</div>
                  <h3 className="font-semibold text-gray-700">System Settings</h3>
                  <p className="text-sm text-gray-600 mt-2">User management, permissions, and system configuration</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">📈</div>
                  <h3 className="font-semibold text-gray-700">System Health</h3>
                  <p className="text-sm text-gray-600 mt-2">Performance monitoring and system diagnostics</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">❓</div>
                  <h3 className="font-semibold text-gray-700">Help & Support</h3>
                  <p className="text-sm text-gray-600 mt-2">Documentation, tutorials, and support resources</p>
                </div>
                <div className="text-center p-4 border border-gray-200 rounded-lg">
                  <div className="text-2xl mb-2">🔗</div>
                  <h3 className="font-semibold text-gray-700">Integration Center</h3>
                  <p className="text-sm text-gray-600 mt-2">Connect with external systems and APIs</p>
                </div>
              </div>
            </div>

            {/* Missing Features Identified */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🚧 Features We Should Add</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">📱 Mobile Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Mobile App for Task Management</li>
                    <li>• Push Notifications</li>
                    <li>• Offline Task Sync</li>
                    <li>• Voice Task Creation</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">🔮 AI Enhancements</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Predictive Task Scheduling</li>
                    <li>• Smart Resource Allocation</li>
                    <li>• Automated Client Communication</li>
                    <li>• Revenue Forecasting</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">🌐 Integration Features</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• CRM Integration</li>
                    <li>• Email Marketing Tools</li>
                    <li>• Calendar Sync (Google/Outlook)</li>
                    <li>• Slack/Teams Integration</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-700 mb-4">📊 Advanced Analytics</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li>• Machine Learning Insights</li>
                    <li>• Custom Dashboards</li>
                    <li>• Real-time Collaboration</li>
                    <li>• Advanced Reporting</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Start Guide */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">🚀 Quick Start Guide</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">1</div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Generate Your First AI Tasks</h3>
                    <p className="text-gray-600">Visit the AI Task Generator to create intelligent tasks from your existing business data.</p>
                    <a href="/test-ai-task-system.html" className="text-blue-600 hover:text-blue-800 text-sm">→ Generate Tasks</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">2</div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Access Your Employee Dashboard</h3>
                    <p className="text-gray-600">Start managing your personal tasks with our intelligent assignment system.</p>
                    <a href="/tasks/dashboard" className="text-purple-600 hover:text-purple-800 text-sm">→ View My Tasks</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">3</div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Monitor Team Performance</h3>
                    <p className="text-gray-600">Use the Admin Control Center to oversee team productivity and revenue protection.</p>
                    <a href="/admin/task-management" className="text-green-600 hover:text-green-800 text-sm">→ Admin Panel</a>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="bg-orange-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-semibold">4</div>
                  <div>
                    <h3 className="font-semibold text-gray-700">Complete Migration (Optional)</h3>
                    <p className="text-gray-600">Migrate all existing followups to the new task-based system.</p>
                    <a href="/followup-to-task-migration.html" className="text-orange-600 hover:text-orange-800 text-sm">→ Migration Panel</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 