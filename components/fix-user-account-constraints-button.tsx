"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { fixUserAccountConstraints } from "@/actions/fix-user-account-constraints"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface FixUserAccountConstraintsButtonProps {
  accountId: string
  onSuccess?: () => void
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function FixUserAccountConstraintsButton({
  accountId,
  onSuccess,
  variant = "default",
  size = "default",
}: FixUserAccountConstraintsButtonProps) {
  const [isFixing, setIsFixing] = useState(false)
  const { toast } = useToast()

  const handleFix = async () => {
    setIsFixing(true)

    try {
      const result = await fixUserAccountConstraints(accountId)

      if (result.success) {
        toast({
          title: "Constraints fixed",
          description: "The account constraints have been fixed. You can now try deleting the account again.",
          variant: "default",
        })

        if (onSuccess) {
          onSuccess()
        }
      } else {
        toast({
          title: "Error fixing constraints",
          description: result.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error in handleFix:", error)
      toast({
        title: "Error fixing constraints",
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
          Fixing...
        </>
      ) : (
        "Fix Constraints"
      )}
    </Button>
  )
}
