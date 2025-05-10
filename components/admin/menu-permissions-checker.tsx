"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"

export function MenuPermissionsChecker() {
  const [isLoading, setIsLoading] = useState(true)
  const [menuItems, setMenuItems] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setIsLoading(true)
        const response = await fetch("/api/menu", {
          headers: {
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        setMenuItems(data)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch menu")
      } finally {
        setIsLoading(false)
      }
    }

    fetchMenu()
  }, [])

  const refreshMenu = () => {
    setIsLoading(true)
    fetch("/api/menu", {
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
        "X-Reload": Date.now().toString(),
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.status} ${response.statusText}`)
        }
        return response.json()
      })
      .then((data) => {
        setMenuItems(data)
        setError(null)
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to fetch menu")
      })
      .finally(() => {
        setIsLoading(false)
      })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Menu Permissions Check</h2>
        <Button onClick={refreshMenu} disabled={isLoading} variant="outline" size="sm">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">Name</th>
                <th className="px-4 py-2 text-left">Path</th>
                <th className="px-4 py-2 text-left">Parent ID</th>
                <th className="px-4 py-2 text-center">Can View</th>
              </tr>
            </thead>
            <tbody>
              {menuItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No menu items found
                  </td>
                </tr>
              ) : (
                menuItems.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="px-4 py-2">{item.id}</td>
                    <td className="px-4 py-2 font-medium">{item.name}</td>
                    <td className="px-4 py-2">{item.path || "-"}</td>
                    <td className="px-4 py-2">{item.parentId || "-"}</td>
                    <td className="px-4 py-2 text-center">{item.permissions?.canView ? "✅" : "❌"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="text-sm text-muted-foreground">Total menu items: {menuItems.length}</div>
    </div>
  )
}
