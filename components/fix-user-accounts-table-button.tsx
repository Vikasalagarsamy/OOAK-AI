"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fixUserAccountsTable } from "@/actions/fix-user-accounts-table"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface FixUserAccountsTableButtonProps {
  onSuccess?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function FixUserAccountsTableButton({
  onSuccess,
  variant = "default",
  size = "default",
}: FixUserAccountsTableButtonProps) {
  const [isFixing, setIsFixing] = useState(false)
  const { toast } = useToast()

  const handleFix = async () => {
    setIsFixing(true)

    try {
      const result = await fixUserAccountsTable()

      if (result.success) {
        toast({
          title: "Table fixed",
          description: "The user accounts table has been fixed. You can now try deleting accounts.",
          variant: "default",
        })

        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Error fixing table",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in handleFix:", error)
      toast({
        title: "Error fixing table",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <Button onClick={handleFix} disabled={isFixing} variant={variant} size={size}>
      {isFixing ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Fixing Table...
        </>
      ) : (
        "Fix User Accounts Table"
      )}
    </Button>
  )
}
