"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { addLeadSourceColumn } from "@/actions/fix-lead-source-column"
import { Loader2, Database } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function FixLeadSourceButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleFix = async () => {
    setLoading(true)
    try {
      const result = await addLeadSourceColumn()

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        })
        // Reload the page to reflect the changes
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to fix lead source column: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleFix} disabled={loading}>
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fixing...
        </>
      ) : (
        <>
          <Database className="mr-2 h-4 w-4" />
          Fix Lead Source Column
        </>
      )}
    </Button>
  )
}
