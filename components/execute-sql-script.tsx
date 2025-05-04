"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

export function ExecuteSqlScript() {
  const [isExecuting, setIsExecuting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleExecute = async () => {
    setIsExecuting(true)
    setResult(null)

    try {
      // Create a Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      if (!supabaseUrl || !supabaseKey) {
        throw new Error("Supabase credentials are not configured")
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      // Execute the SQL statements one by one

      // 1. Drop the existing constraint
      await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE employee_companies DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key;`,
      })

      // 2. Add the new constraint
      await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE employee_companies ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key UNIQUE (employee_id, company_id, branch_id);`,
      })

      // 3. Update the validation function
      await supabase.rpc("exec_sql", {
        sql: `
          CREATE OR REPLACE FUNCTION validate_employee_company_allocation()
          RETURNS TRIGGER AS $$
          BEGIN
            -- Check if total allocation would exceed 100%
            IF (
              SELECT SUM(allocation_percentage)
              FROM employee_companies
              WHERE employee_id = NEW.employee_id
              AND (id != NEW.id OR NEW.id IS NULL)
            ) + NEW.allocation_percentage > 100 THEN
              RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%';
            END IF;
            
            -- Check if this company-branch combination already exists for this employee
            IF EXISTS (
              SELECT 1
              FROM employee_companies
              WHERE employee_id = NEW.employee_id
              AND company_id = NEW.company_id
              AND branch_id = NEW.branch_id
              AND id != NEW.id
            ) THEN
              RAISE EXCEPTION 'This company-branch combination already exists for this employee';
            END IF;
            
            RETURN NEW;
          END;
          $$ LANGUAGE plpgsql;
        `,
      })

      setResult({
        success: true,
        message:
          "Database constraints updated successfully. You can now allocate the same company to different branches.",
      })
    } catch (error) {
      console.error("Error executing SQL:", error)
      setResult({
        success: false,
        message: `Error updating constraints: ${error instanceof Error ? error.message : String(error)}`,
      })
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Employee Company Constraints</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>
          This will update the database constraints to allow allocating the same company to different branches. The
          system will prevent duplicate company-branch combinations and ensure the total allocation percentage doesn't
          exceed 100%.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Button onClick={handleExecute} disabled={isExecuting}>
          {isExecuting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating Constraints...
            </>
          ) : (
            "Update Constraints"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
