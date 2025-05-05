"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fixUserAccountsSchema } from "@/actions/fix-user-accounts-schema"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function FixUserAccountsSchemaButton() {
  const [isFixing, setIsFixing] = useState(false)
  const { toast } = useToast()

  const handleFix = async () => {
    setIsFixing(true)
    try {
      const result = await fixUserAccountsSchema()

      if (result.success) {
        toast({
          title: "Schema fixed successfully",
          description: "The user accounts table has been fixed. Please refresh the page.",
          variant: "default",
        })

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        toast({
          title: "Error fixing schema",
          description: result.error || "An error occurred",
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
      setIsFixing(false)
    }
  }

  return (
    <Button onClick={handleFix} disabled={isFixing} variant="default">
      {isFixing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fixing Schema...
        </>
      ) : (
        "Fix Database Schema"
      )}
    </Button>
  )
}
