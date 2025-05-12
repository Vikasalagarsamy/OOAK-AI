"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

interface ExecuteSqlProps {
  onExecute: (sql: string) => Promise<{ success: boolean; message: string }>
}

export function ExecuteSql({ onExecute }: ExecuteSqlProps) {
  const [sql, setSql] = useState("")
  const [isExecuting, setIsExecuting] = useState(false)

  const handleExecute = async () => {
    if (!sql.trim()) {
      toast({
        title: "SQL Required",
        description: "Please enter SQL to execute",
        variant: "destructive",
      })
      return
    }

    setIsExecuting(true)
    try {
      const result = await onExecute(sql)

      if (result.success) {
        toast({
          title: "SQL Executed Successfully",
          description: result.message,
        })
      } else {
        toast({
          title: "SQL Execution Failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error executing SQL:", error)
      toast({
        title: "Execution Failed",
        description: "An unexpected error occurred during SQL execution",
        variant: "destructive",
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Execute SQL</CardTitle>
        <CardDescription>Execute SQL statements directly on the database. Use with caution!</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          placeholder="Enter SQL statement..."
          className="font-mono h-40"
        />
        <Button onClick={handleExecute} disabled={isExecuting}>
          {isExecuting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Executing...
            </>
          ) : (
            "Execute SQL"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
