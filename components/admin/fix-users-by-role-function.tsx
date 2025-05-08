"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export function FixUsersByRoleFunction() {
  const [isLoading, setIsLoading] = useState(false)
  const [isFixed, setIsFixed] = useState(false)

  const fixFunction = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/fix-users-by-role-function", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error(`Failed to fix function: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setIsFixed(true)
        toast({
          title: "Success",
          description: "The users by role function has been fixed. Please refresh the role permissions page.",
        })
      } else {
        throw new Error(data.error || "Unknown error occurred")
      }
    } catch (error: any) {
      console.error("Error fixing function:", error)
      toast({
        title: "Error",
        description: `Failed to fix function: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Users by Role Function</CardTitle>
        <CardDescription>This will fix the database function that retrieves users by role.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>
          The current function structure doesn't match what the application expects. This fix will update the function
          to return the correct structure.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={fixFunction} disabled={isLoading || isFixed}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : isFixed ? (
            "Fixed Successfully"
          ) : (
            "Fix Function"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
