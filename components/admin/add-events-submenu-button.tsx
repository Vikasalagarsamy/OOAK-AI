"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addEventsSubmenuItem } from "@/actions/add-events-submenu-item"
import { useToast } from "@/components/ui/use-toast"

export function AddEventsSubmenuButton() {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleAddSubmenu = async () => {
    setIsLoading(true)
    try {
      const result = await addEventsSubmenuItem()

      if (result.success) {
        toast({
          title: "Success",
          description: "Events submenu item has been added to Event Coordination menu",
          variant: "default",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to add Events submenu item",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleAddSubmenu} disabled={isLoading} className="w-full md:w-auto">
      {isLoading ? "Adding..." : "Add Events Submenu Item"}
    </Button>
  )
}
