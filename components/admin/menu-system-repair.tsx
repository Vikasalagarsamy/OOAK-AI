"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase-browser"
import { toast } from "@/components/ui/use-toast"

interface RepairResult {
  status: "success" | "error" | "warning"
  message: string
  details?: string
}

export function MenuSystemRepair() {
  const [isRepairing, setIsRepairing] = useState(false)
  const [results, setResults] = useState<RepairResult[]>([])
  const supabase = createClient()

  const runRepairs = async () => {
    setIsRepairing(true)
    setResults([])
    const repairResults: RepairResult[] = []

    try {
      // Step 1: Check and create menu_items table if needed
      try {
        const { error: menuTableCheckError } = await supabase.from("menu_items").select("id").limit(1)

        if (menuTableCheckError) {
          // Table doesn't exist, create it
          const { error: createTableError } = await supabase.rpc("execute_sql", {
            sql_query: `
              CREATE TABLE IF NOT EXISTS menu_items (
                id SERIAL PRIMARY KEY,
                parent_id INTEGER REFERENCES menu_items(id),
                name VARCHAR(255) NOT NULL,
                description TEXT,
                icon VARCHAR(100),
                path VARCHAR(255),
                sort_order INTEGER NOT NULL DEFAULT 0,
                is_visible BOOLEAN NOT NULL DEFAULT true
              );
            `,
          })

          if (createTableError) {
            repairResults.push({
              status: "error",
              message: "Failed to create menu_items table",
              details: createTableError.message,
            })
          } else {
            repairResults.push({
              status: "success",
              message: "Created menu_items table",
            })
          }
        }
      } catch (error: any) {
        repairResults.push({
          status: "error",
          message: "Error checking menu_items table",
          details: error.message,
        })
      }

      // Step 2: Check and create role_menu_permissions table if needed
      try {
        const { error: permissionsTableCheckError } = await supabase.from("role_menu_permissions").select("id").limit(1)

        if (permissionsTableCheckError) {
          // Table doesn't exist, create it
          const { error: createTableError } = await supabase.rpc("execute_sql", {
            sql_query: `
              CREATE TABLE IF NOT EXISTS role_menu_permissions (
                id SERIAL PRIMARY KEY,
                role_id INTEGER NOT NULL,
                menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
                can_view BOOLEAN NOT NULL DEFAULT false,
                can_add BOOLEAN NOT NULL DEFAULT false,
                can_edit BOOLEAN NOT NULL DEFAULT false,
                can_delete BOOLEAN NOT NULL DEFAULT false,
                UNIQUE(role_id, menu_item_id)
              );
            `,
          })

          if (createTableError) {
            repairResults.push({
              status: "error",
              message: "Failed to create role_menu_permissions table",
              details: createTableError.message,
            })
          } else {
            repairResults.push({
              status: "success",
              message: "Created role_menu_permissions table",
            })
          }
        }
      } catch (error: any) {
        repairResults.push({
          status: "error",
          message: "Error checking role_menu_permissions table",
          details: error.message,
        })
      }

      // Step 3: Run seed script to ensure default menu items exist
      try {
        const { error: seedError } = await supabase.rpc("execute_sql", {
          sql_query: `
            -- Insert default menu items if they don't exist
            INSERT INTO menu_items (id, parent_id, name, icon, path, sort_order, is_visible)
            VALUES 
                (1, NULL, 'Dashboard', 'LayoutDashboard', '/dashboard', 10, true),
                (2, NULL, 'Organization', 'Building2', NULL, 20, true),
                (3, 2, 'Companies', 'Building', '/organization/companies', 10, true),
                (4, 2, 'Branches', 'GitBranch', '/organization/branches', 20, true),
                (5, 2, 'Roles', 'Shield', '/organization/roles', 30, true),
                (6, 2, 'User Accounts', 'Users', '/organization/user-accounts', 40, true),
                (7, NULL, 'People', 'Users', NULL, 30, true),
                (8, 7, 'Dashboard', 'LayoutDashboard', '/people/dashboard', 10, true),
                (9, 7, 'Employees', 'User', '/people/employees', 20, true),
                (10, 7, 'Departments', 'Briefcase', '/people/departments', 30, true),
                (11, 7, 'Designations', 'BadgeCheck', '/people/designations', 40, true),
                (12, NULL, 'Sales', 'TrendingUp', NULL, 40, true),
                (13, 12, 'Dashboard', 'LayoutDashboard', '/sales', 10, true),
                (14, 12, 'Create Lead', 'FilePlus', '/sales/create-lead', 20, true),
                (15, 12, 'My Leads', 'ListChecks', '/sales/my-leads', 30, true),
                (16, 12, 'Unassigned Leads', 'List', '/sales/unassigned-lead', 40, true),
                (17, 12, 'Follow Up', 'Calendar', '/sales/follow-up', 50, true),
                (18, 12, 'Quotation', 'FileText', '/sales/quotation', 60, true),
                (19, 12, 'Order Confirmation', 'CheckCircle', '/sales/order-confirmation', 70, true),
                (20, 12, 'Rejected Leads', 'XCircle', '/sales/rejected-leads', 80, true),
                (21, 12, 'Lead Sources', 'Globe', '/sales/lead-sources', 90, true),
                (22, NULL, 'Admin', 'Settings', NULL, 999, true),
                (23, 22, 'Menu Permissions', 'Menu', '/admin/menu-permissions', 10, true),
                (24, 22, 'Menu Debug', 'Bug', '/admin/menu-debug', 20, true)
            ON CONFLICT (id) DO NOTHING;
          `,
        })

        if (seedError) {
          repairResults.push({
            status: "error",
            message: "Failed to seed default menu items",
            details: seedError.message,
          })
        } else {
          repairResults.push({
            status: "success",
            message: "Seeded default menu items",
          })
        }
      } catch (error: any) {
        repairResults.push({
          status: "error",
          message: "Error seeding menu items",
          details: error.message,
        })
      }

      // Step 4: Ensure Administrator role has permissions
      try {
        // First, check if Administrator role exists
        const { data: adminRole, error: adminRoleError } = await supabase
          .from("roles")
          .select("id")
          .eq("title", "Administrator")
          .single()

        if (adminRoleError) {
          repairResults.push({
            status: "warning",
            message: "Administrator role not found",
            details: "Unable to grant default permissions without Administrator role",
          })
        } else {
          // Ensure Administrator has permissions for all menu items
          const { error: deletePermissionsError } = await supabase
            .from("role_menu_permissions")
            .delete()
            .eq("role_id", adminRole.id)

          if (deletePermissionsError) {
            repairResults.push({
              status: "error",
              message: "Failed to reset Administrator permissions",
              details: deletePermissionsError.message,
            })
          } else {
            // Get all menu items
            const { data: menuItems, error: menuItemsError } = await supabase.from("menu_items").select("id")

            if (menuItemsError || !menuItems) {
              repairResults.push({
                status: "error",
                message: "Failed to fetch menu items",
                details: menuItemsError?.message,
              })
            } else {
              // Create permissions for Admin role
              const permissionsToInsert = menuItems.map((item) => ({
                role_id: adminRole.id,
                menu_item_id: item.id,
                can_view: true,
                can_add: true,
                can_edit: true,
                can_delete: true,
              }))

              const { error: insertPermissionsError } = await supabase
                .from("role_menu_permissions")
                .insert(permissionsToInsert)

              if (insertPermissionsError) {
                repairResults.push({
                  status: "error",
                  message: "Failed to assign Administrator permissions",
                  details: insertPermissionsError.message,
                })
              } else {
                repairResults.push({
                  status: "success",
                  message: `Assigned full permissions to Administrator role for ${menuItems.length} menu items`,
                })
              }
            }
          }
        }
      } catch (error: any) {
        repairResults.push({
          status: "error",
          message: "Error assigning Administrator permissions",
          details: error.message,
        })
      }

      // Done with repairs
      const successCount = repairResults.filter((r) => r.status === "success").length
      const errorCount = repairResults.filter((r) => r.status === "error").length

      if (errorCount === 0) {
        toast({
          title: "Repair completed successfully",
          description: `Fixed ${successCount} issues with the menu system`,
        })
      } else {
        toast({
          title: "Repair completed with errors",
          description: `Fixed ${successCount} issues, but ${errorCount} errors occurred`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Repair failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setResults(repairResults)
      setIsRepairing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menu System Repair</CardTitle>
        <CardDescription>Fix common issues with the menu system configuration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Caution</AlertTitle>
            <AlertDescription>
              This tool will reset Administrator permissions and attempt to fix menu system configuration issues. It is
              recommended to back up your database before proceeding.
            </AlertDescription>
          </Alert>

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-medium">Repair Results:</h3>
              {results.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-md ${
                    result.status === "success"
                      ? "bg-green-50"
                      : result.status === "warning"
                        ? "bg-yellow-50"
                        : "bg-red-50"
                  }`}
                >
                  <div className="flex items-start">
                    {result.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 mr-2" />
                    ) : result.status === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 mr-2" />
                    )}
                    <div>
                      <p className="font-medium">{result.message}</p>
                      {result.details && <p className="text-sm mt-1 text-gray-600">{result.details}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runRepairs} disabled={isRepairing}>
          {isRepairing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Repairing...
            </>
          ) : (
            "Run Repair"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
