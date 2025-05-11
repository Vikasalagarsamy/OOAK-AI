import { RefreshMenuButton } from "@/components/admin/refresh-menu-button"

export default function FixMenuPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Fix Menu Issues</h1>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Menu Cache Refresh</h2>
        <p className="mb-4">
          If you're seeing outdated or incorrect menu items, try refreshing the menu cache. This will clear any cached
          menu data and reload the latest configuration from the database.
        </p>
        <RefreshMenuButton />
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Menu Troubleshooting</h2>
        <p className="mb-2">If you're still seeing issues with the menu after refreshing:</p>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Check that the menu items are correctly configured in the database</li>
          <li>Ensure that role permissions are properly set for the menu items</li>
          <li>Clear your browser cache or try in a private/incognito window</li>
          <li>Check the browser console for any JavaScript errors</li>
        </ol>
      </div>
    </div>
  )
}
