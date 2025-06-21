import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FixAccountCreationMenu } from "@/components/admin/fix-account-creation-menu"

export default function FixAccountCreationPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Fix Account Creation Menu</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Creation Menu Fix</CardTitle>
          <CardDescription>Fix visibility and permission issues with the Account Creation menu item</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>This utility will fix the following issues with the Account Creation menu:</p>

            <ul className="list-disc pl-5 space-y-1">
              <li>Ensure the Account Creation menu item exists in the database</li>
              <li>Set the menu item to visible</li>
              <li>Ensure it has the correct path (/organization/account-creation)</li>
              <li>Ensure it has the correct parent (Organization)</li>
              <li>Grant full permissions to the Administrator role</li>
            </ul>

            <div className="pt-4">
              <FixAccountCreationMenu />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
