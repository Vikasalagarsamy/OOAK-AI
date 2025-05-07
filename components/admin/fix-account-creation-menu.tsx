"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fixAccountCreationMenu } from "@/actions/fix-account-creation-menu"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function FixAccountCreationMenu() {
  const [loading, setLoading] = useState(false)

  const handleFix = async () => {
    try {
      setLoading(true)
      const result = await fixAccountCreationMenu()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to fix account creation menu: ${error.message || "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFix} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Fix Account Creation Menu
    </Button>
  )
}
