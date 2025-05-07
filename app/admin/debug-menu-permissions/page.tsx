import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MenuPermissionsDebugger } from "@/components/admin/menu-permissions-debugger"

export default function DebugMenuPermissionsPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Debug Menu Permissions</h1>

      <Card>
        <CardHeader>
          <CardTitle>Menu Permissions Debugger</CardTitle>
          <CardDescription>Analyze menu permissions and visibility issues for different roles</CardDescription>
        </CardHeader>
        <CardContent>
          <MenuPermissionsDebugger />
        </CardContent>
      </Card>
    </div>
  )
}
