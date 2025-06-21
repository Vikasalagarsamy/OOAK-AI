import { MenuDebugView } from "@/components/menu-system/menu-debug-view"
import { EmergencyMenuReset } from "@/components/admin/emergency-menu-reset"

export default function MenuDiagnosticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">Menu System Diagnostics</h1>
        <p className="text-muted-foreground">
          This page provides tools to diagnose and fix issues with the menu system.
        </p>
      </div>

      <MenuDebugView />

      <div className="p-4 border rounded-md bg-amber-50">
        <h2 className="text-xl font-semibold mb-2">Emergency Menu Reset</h2>
        <p className="mb-4 text-amber-800">
          Use this option only if the menu system is completely broken and you need to reset it to its default state.
          This will reset all menu permissions for the Administrator role.
        </p>
        <EmergencyMenuReset />
      </div>
    </div>
  )
}
