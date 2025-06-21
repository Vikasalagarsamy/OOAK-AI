'use client'

export default function MenuPermissionsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-4">Menu Permissions</h1>
        <p className="text-gray-600 mb-6">
          Manage menu access permissions for different user roles
        </p>
        
        <div className="space-y-4">
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Admin Access</h3>
            <p className="text-gray-600">Full access to all menu items and administrative functions</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Sales Team</h3>
            <p className="text-gray-600">Access to sales, leads, and customer management</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active
              </span>
            </div>
          </div>
          
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">HR Team</h3>
            <p className="text-gray-600">Access to employee management and organizational features</p>
            <div className="mt-2">
              <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm">
                Active
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Permission Management</h3>
          <p className="text-blue-600">
            Menu permissions are automatically configured based on user roles and can be customized as needed.
          </p>
        </div>
      </div>
    </div>
  )
}
