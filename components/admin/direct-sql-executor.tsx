"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { executeDirectSql } from "@/actions/execute-direct-sql"

export function DirectSqlExecutor() {
  const [sql, setSql] = useState<string>(`
-- Grant all permissions to Administrator role
DELETE FROM role_menu_permissions WHERE role_id = 1;

INSERT INTO role_menu_permissions (role_id, menu_item_id, can_view, can_add, can_edit, can_delete)
SELECT 
    1 as role_id, 
    id as menu_item_id, 
    TRUE as can_view,
    TRUE as can_add,
    TRUE as can_edit,
    TRUE as can_delete
FROM 
    menu_items;
  `)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleExecute = async () => {
    if (!sql.trim()) return

    setIsLoading(true)
    try {
      const response = await executeDirectSql(sql)
      setResult(response)
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <h2 className="text-xl font-bold">Direct SQL Execution</h2>
        <p className="text-muted-foreground text-sm">
          <strong>Warning:</strong> This tool allows direct execution of SQL statements. Use with extreme caution.
        </p>
      </div>

      <Textarea
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        className="font-mono h-64"
        placeholder="Enter SQL statements..."
      />

      <div className="flex items-center space-x-4">
        <Button onClick={handleExecute} disabled={isLoading || !sql.trim()}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isLoading ? "Executing..." : "Execute SQL"}
        </Button>

        <Button variant="outline" onClick={() => window.location.reload()} disabled={isLoading}>
          Reload Page
        </Button>
      </div>

      {result && (
        <Alert variant={result.success ? "default" : "destructive"}>
          {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
          <AlertDescription>{result.message}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
