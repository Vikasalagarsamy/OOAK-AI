"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { UsersByRole } from "./users-by-role-client"
import { UserRoleAssignmentForm } from "./user-role-assignment-client"

export function UserRoleAssignmentManager({ initialRoleId }: { initialRoleId?: string }) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | undefined>(initialRoleId)

  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId)
  }

  return (
    <Tabs defaultValue="view" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="view">View Users by Role</TabsTrigger>
        <TabsTrigger value="assign">Assign Roles</TabsTrigger>
      </TabsList>
      <TabsContent value="view">
        <UsersByRole roleId={selectedRoleId} />
      </TabsContent>
      <TabsContent value="assign">
        <UserRoleAssignmentForm />
      </TabsContent>
    </Tabs>
  )
}
