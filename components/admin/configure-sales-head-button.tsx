"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { configureSalesHeadPermissions } from "@/actions/configure-sales-head-permissions"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function ConfigureSalesHeadButton() {
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const result = await configureSalesHeadPermissions()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Failed to configure permissions: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? "Configuring..." : "Configure Sales Head Permissions"}
    </Button>
  )
}
