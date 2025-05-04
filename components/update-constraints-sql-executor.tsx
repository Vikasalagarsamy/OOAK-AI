"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function UpdateConstraintsSqlExecutor() {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleClick = async () => {
    setIsLoading(true)
    try {
      // SQL script to execute
      const sqlScript = `
      -- Drop the existing unique constraint on employee_id and company_id if it exists
      ALTER TABLE employee_companies 
      DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key;

      -- Add a new unique constraint that includes branch_id
      ALTER TABLE employee_companies 
      ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key 
      UNIQUE (employee_id, company_id, branch_id);

      -- Update the validation trigger function to check for company-branch combinations
      CREATE OR REPLACE FUNCTION validate_employee_company_allocation()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if the total allocation percentage exceeds 100%
        IF (
          SELECT SUM(allocation_percentage)
          FROM employee_companies
          WHERE employee_id = NEW.employee_id
          AND (NEW.id IS NULL OR id != NEW.id) -- Exclude the current record if it's an update
        ) + NEW.allocation_percentage > 100 THEN
          RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%';
        END IF;
        
        -- Check if this specific company-branch combination already exists
        IF EXISTS (
          SELECT 1
          FROM employee_companies
          WHERE employee_id = NEW.employee_id
          AND company_id = NEW.company_id
          AND branch_id = NEW.branch_id
          AND (NEW.id IS NULL OR id != NEW.id) -- Exclude the current record if it's an update
        ) THEN
          RAISE EXCEPTION 'This employee already has an allocation for this company and branch combination';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Make sure the trigger exists
      DROP TRIGGER IF EXISTS validate_employee_company_allocation_trigger ON employee_companies;
      
      CREATE TRIGGER validate_employee_company_allocation_trigger
      BEFORE INSERT OR UPDATE ON employee_companies
      FOR EACH ROW
      EXECUTE FUNCTION validate_employee_company_allocation();
      `

      // Execute the SQL script using a stored procedure or direct query
      // For this example, we'll use multiple separate queries

      // 1. Drop the existing constraint
      const { error: dropError } = await supabase.rpc("execute_sql", {
        sql_statement:
          "ALTER TABLE employee_companies DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key",
      })

      if (dropError) {
        console.error("Error dropping constraint:", dropError)
        toast({
          title: "Error",
          description: `Failed to drop constraint: ${dropError.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 2. Add the new constraint
      const { error: addError } = await supabase.rpc("execute_sql", {
        sql_statement:
          "ALTER TABLE employee_companies ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key UNIQUE (employee_id, company_id, branch_id)",
      })

      if (addError) {
        console.error("Error adding constraint:", addError)
        toast({
          title: "Error",
          description: `Failed to add constraint: ${addError.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 3. Create the validation function
      const { error: funcError } = await supabase.rpc("execute_sql", {
        sql_statement: `
        CREATE OR REPLACE FUNCTION validate_employee_company_allocation()
        RETURNS TRIGGER AS $$
        BEGIN
          -- Check if the total allocation percentage exceeds 100%
          IF (
            SELECT SUM(allocation_percentage)
            FROM employee_companies
            WHERE employee_id = NEW.employee_id
            AND (NEW.id IS NULL OR id != NEW.id)
          ) + NEW.allocation_percentage > 100 THEN
            RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%';
          END IF;
          
          -- Check if this specific company-branch combination already exists
          IF EXISTS (
            SELECT 1
            FROM employee_companies
            WHERE employee_id = NEW.employee_id
            AND company_id = NEW.company_id
            AND branch_id = NEW.branch_id
            AND (NEW.id IS NULL OR id != NEW.id)
          ) THEN
            RAISE EXCEPTION 'This employee already has an allocation for this company and branch combination';
          END IF;
          
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        `,
      })

      if (funcError) {
        console.error("Error creating function:", funcError)
        toast({
          title: "Error",
          description: `Failed to create validation function: ${funcError.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 4. Create the trigger
      const { error: triggerError } = await supabase.rpc("execute_sql", {
        sql_statement: `
        DROP TRIGGER IF EXISTS validate_employee_company_allocation_trigger ON employee_companies;
        
        CREATE TRIGGER validate_employee_company_allocation_trigger
        BEFORE INSERT OR UPDATE ON employee_companies
        FOR EACH ROW
        EXECUTE FUNCTION validate_employee_company_allocation();
        `,
      })

      if (triggerError) {
        console.error("Error creating trigger:", triggerError)
        toast({
          title: "Error",
          description: `Failed to create trigger: ${triggerError.message}`,
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      toast({
        title: "Success",
        description:
          "Database constraints updated successfully. The system now allows the same company to be assigned to different branches.",
        variant: "default",
      })
    } catch (error) {
      console.error("Error updating constraints:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleClick} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
        </>
      ) : (
        "Update Database Constraints"
      )}
    </Button>
  )
}
