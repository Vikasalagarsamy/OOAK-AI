"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { useState } from "react"
import { UsersByRole } from "./users-by-role-client"
import { UserRoleAssignmentForm } from "./user-role-assignment-client"
import { RolePermissionManager } from "./role-permission-manager"

export function UserRoleAssignmentManager() {
  const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(undefined)

  const handleRoleSelect = (roleId: number) => {
    setSelectedRoleId(roleId)
  }

  return (
    <div className="container mx-auto py-6">
      <Tabs defaultValue="permissions" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permissions">Menu Permissions</TabsTrigger>
          <TabsTrigger value="users">Users by Role</TabsTrigger>
          <TabsTrigger value="assign">Assign Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="permissions">
          <Card>
            <CardContent className="pt-6">
              <RolePermissionManager onRoleSelect={handleRoleSelect} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="users">
          <UsersByRole roleId={selectedRoleId?.toString()} />
        </TabsContent>
        <TabsContent value="assign">
          <UserRoleAssignmentForm />
        </TabsContent>
      </Tabs>
    </div>
  )
}
