import { getCurrentUser } from "@/actions/auth-actions"
import { getCompleteMenuForUser } from "@/services/direct-menu-service"
import { redirect } from "next/navigation"

export default async function MenuDebugPage() {
  const user = await getCurrentUser()

  if (!user || !user.isAdmin) {
    redirect("/login")
  }

  const menuItems = await getCompleteMenuForUser(user.id)

  // Group menu items by parent
  const topLevelItems = menuItems.filter((item) => item.parentId === null)

  const getChildren = (parentId: number) => {
    return menuItems.filter((item) => item.parentId === parentId)
  }

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Menu Debug</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Menu Structure</h2>

          <div className="space-y-4">
            {topLevelItems.map((item) => (
              <div key={item.id} className="border-l-2 pl-4">
                <div className="font-medium">
                  {item.name} (ID: {item.id})
                </div>
                <div className="text-sm text-muted-foreground">Path: {item.path || "None"}</div>

                <div className="mt-2 space-y-2">
                  {getChildren(item.id).map((child) => (
                    <div key={child.id} className="border-l-2 pl-4 ml-4">
                      <div>
                        {child.name} (ID: {child.id})
                      </div>
                      <div className="text-sm text-muted-foreground">Path: {child.path || "None"}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border rounded-lg p-4">
          <h2 className="text-lg font-medium mb-4">Menu Statistics</h2>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Total Menu Items:</span>
              <span className="font-medium">{menuItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Top Level Items:</span>
              <span className="font-medium">{topLevelItems.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Items with Paths:</span>
              <span className="font-medium">{menuItems.filter((item) => !!item.path).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Items without Paths:</span>
              <span className="font-medium">{menuItems.filter((item) => !item.path).length}</span>
            </div>
          </div>

          <h3 className="text-md font-medium mt-6 mb-2">Permissions</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Items with View Permission:</span>
              <span className="font-medium">{menuItems.filter((item) => item.canView).length}</span>
            </div>
            <div className="flex justify-between">
              <span>Items without View Permission:</span>
              <span className="font-medium">{menuItems.filter((item) => !item.canView).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border rounded-lg p-4">
        <h2 className="text-lg font-medium mb-4">Raw Menu Data</h2>
        <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">{JSON.stringify(menuItems, null, 2)}</pre>
      </div>
    </div>
  )
}
