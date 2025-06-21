'use client'

export default function DatabaseSyncPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Database Synchronization</h1>
        <p className="text-gray-600 mb-6">
          Real-time backup and synchronization between local and production databases
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800">Local Database</h3>
            <p className="text-blue-600">ooak_future (Development)</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active
              </span>
            </div>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800">Production Database</h3>
            <p className="text-purple-600">ooak_future_production (Backup)</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Synced
              </span>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800">Sync Status</h3>
            <p className="text-green-600">Continuous monitoring</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Running
              </span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Continuous Backup Active</h3>
          <p className="text-blue-600">
            All database changes are automatically synchronized to production every 30 seconds
          </p>
        </div>
      </div>
    </div>
  )
}
