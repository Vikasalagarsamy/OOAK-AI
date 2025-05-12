"use client"

import { useEffect, useState } from "react"
import { getMenuItems } from "@/services/menu-service"
import type { MenuItem } from "@/types/menu-permissions"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, ArrowRight } from "lucide-react"

export function EventsSubmenuFinder() {
  const [eventsMenuItem, setEventsMenuItem] = useState<MenuItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function findEventsSubmenu() {
      setIsLoading(true)
      try {
        const menuItems = await getMenuItems()
        const eventCoordinationMenu = menuItems.find(
          (item) => item.name === "Event Co-ordination" && item.parentId === null,
        )

        if (eventCoordinationMenu) {
          const eventsSubmenu = menuItems.find(
            (item) => item.name === "Events" && item.parentId === eventCoordinationMenu.id,
          )

          setEventsMenuItem(eventsSubmenu || null)
        }
      } catch (error) {
        console.error("Error finding Events submenu:", error)
      } finally {
        setIsLoading(false)
      }
    }

    findEventsSubmenu()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!eventsMenuItem) {
    return (
      <Card className="bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-600">Events Submenu Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The Events submenu could not be found under the Event Coordination menu.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-green-50">
      <CardHeader>
        <CardTitle className="text-green-600 flex items-center">
          <Calendar className="mr-2" size={20} />
          Events Submenu Found!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {eventsMenuItem.name}
          </p>
          <p>
            <strong>Path:</strong> {eventsMenuItem.path}
          </p>
          <p>
            <strong>Icon:</strong> {eventsMenuItem.icon}
          </p>
          <p>
            <strong>Sort Order:</strong> {eventsMenuItem.sortOrder}
          </p>
          <p>
            <strong>Visible:</strong> {eventsMenuItem.isVisible ? "Yes" : "No"}
          </p>

          <div className="mt-4">
            <Button asChild>
              <a href={eventsMenuItem.path}>
                Go to Events Page <ArrowRight className="ml-2" size={16} />
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
