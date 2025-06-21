"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"


export function UpdateConstraintsSqlExecutor() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    try {
      console.log('🔄 Starting database constraints update...')

      // Use transaction for atomic constraint updates
      const result = await transaction(async (queryFn) => {
        // 1. Drop the existing constraint
        console.log('🗑️ Dropping existing constraint...')
        await queryFn(`
          ALTER TABLE employee_companies 
          DROP CONSTRAINT IF EXISTS employee_companies_employee_id_company_id_key
        `)

        // 2. Add the new constraint
        console.log('➕ Adding new constraint...')
        await queryFn(`
          ALTER TABLE employee_companies 
          ADD CONSTRAINT employee_companies_employee_id_company_id_branch_id_key 
          UNIQUE (employee_id, company_id, branch_id)
        `)

        // 3. Create the validation function
        console.log('🔧 Creating validation function...')
        await queryFn(`
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
              RAISE EXCEPTION 'Total allocation percentage cannot exceed 100%%';
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
        `)

        // 4. Create the trigger
        console.log('🎯 Creating trigger...')
        await queryFn(`
          DROP TRIGGER IF EXISTS validate_employee_company_allocation_trigger ON employee_companies;
          
          CREATE TRIGGER validate_employee_company_allocation_trigger
          BEFORE INSERT OR UPDATE ON employee_companies
          FOR EACH ROW
          EXECUTE FUNCTION validate_employee_company_allocation();
        `)

        return { success: true }
      })

      if (!result.success) {
        throw new Error(result.error || 'Failed to update constraints')
      }

      console.log('✅ Database constraints updated successfully')
      toast({
        title: "Success",
        description: "Database constraints updated successfully. The system now allows the same company to be assigned to different branches.",
        variant: "default",
      })

    } catch (error: any) {
      console.error("❌ Error updating constraints:", error)
      toast({
        title: "Error",
        description: `Failed to update constraints: ${error.message}`,
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
