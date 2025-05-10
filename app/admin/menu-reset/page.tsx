import { EmergencyMenuReset } from "@/components/admin/emergency-menu-reset"

export default function MenuResetPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Menu System Reset</h1>
      <p className="text-gray-500">
        This page provides tools to reset the menu system when it's not working correctly.
      </p>

      <div className="grid gap-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Warning:</strong> Use this tool only as a last resort. It will reset all menu permissions for
                the Administrator role.
              </p>
            </div>
          </div>
        </div>

        <EmergencyMenuReset />
      </div>
    </div>
  )
}
