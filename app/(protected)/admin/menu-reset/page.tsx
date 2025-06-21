import { EmergencyMenuReset } from "@/components/admin/emergency-menu-reset"

export default function MenuResetPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Menu System Reset</h1>
        <p className="text-muted-foreground">Use this page to reset the menu system if you're experiencing issues.</p>
      </div>

      <div className="p-6 border rounded-md bg-amber-50">
        <h2 className="text-xl font-semibold mb-4">Emergency Menu Reset</h2>
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-md border border-amber-200">
            <h3 className="font-medium text-amber-800 mb-2">What this does:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Clears all menu caches</li>
              <li>Ensures all menu items are properly assigned to the Administrator role</li>
              <li>Forces a complete reload of the menu system</li>
              <li>Logs the reset action for audit purposes</li>
            </ul>
          </div>

          <div className="bg-white p-4 rounded-md border border-amber-200">
            <h3 className="font-medium text-amber-800 mb-2">When to use:</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Menu items are missing for administrators</li>
              <li>Menu permissions are not working correctly</li>
              <li>Changes to menu items are not appearing</li>
              <li>As a last resort when other troubleshooting steps have failed</li>
            </ul>
          </div>

          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <h3 className="font-medium text-red-800 mb-2">Warning:</h3>
            <p className="text-sm text-red-700">
              This action will force all users to reload their menu. It should only be used when necessary and
              preferably during low-traffic periods.
            </p>
          </div>

          <EmergencyMenuReset />
        </div>
      </div>
    </div>
  )
}
