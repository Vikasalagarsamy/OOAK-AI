import { ConfigureSalesHeadButton } from "@/components/admin/configure-sales-head-button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ShieldCheck } from "lucide-react"

export default function ConfigureSalesHeadPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Configure Sales Head Permissions</h1>

      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <ShieldCheck className="h-4 w-4 text-blue-600" />
        <AlertTitle>Access Control Configuration</AlertTitle>
        <AlertDescription>
          This page allows you to configure proper access control for the Sales Head role, ensuring they cannot access
          administrative menus.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Sales Head Role Configuration</CardTitle>
          <CardDescription>Configure the Sales Head role to have appropriate permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>Clicking the button below will:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Create the Sales Head role if it doesn't exist</li>
            <li>Grant access to sales-related menus and dashboards</li>
            <li>Explicitly deny access to administrative menus</li>
            <li>Configure appropriate view, add, edit, and delete permissions</li>
          </ul>

          <div className="pt-4">
            <ConfigureSalesHeadButton />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">After configuring the Sales Head role, you should:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>
              Go to{" "}
              <a href="/admin/test-rbac" className="text-blue-600 hover:underline">
                Test RBAC
              </a>{" "}
              to verify the permissions are working correctly
            </li>
            <li>Assign users to the Sales Head role as needed</li>
            <li>Test by logging in as a user with the Sales Head role</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
