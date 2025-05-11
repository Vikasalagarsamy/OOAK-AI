import { MenuSyncButton } from "@/components/admin/menu-sync-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function MenuSyncPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Menu Synchronization</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Synchronize Menu Structure</CardTitle>
          <CardDescription>
            Ensure that the menu structure in the role permissions section matches the main navigation menu.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            This action will synchronize the menu items in the database with the menu structure defined in the code. It
            will add any missing menu items and update parent-child relationships.
          </p>

          <MenuSyncButton />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>What This Does</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            <li>Scans the menu structure defined in the code</li>
            <li>Compares it with the menu items in the database</li>
            <li>Adds any missing menu items</li>
            <li>Updates parent-child relationships</li>
            <li>Ensures consistent menu structure across the application</li>
          </ul>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-800">
              <strong>Note:</strong> This action does not delete any existing menu items. If you need to remove menu
              items, please do so manually through the database.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
