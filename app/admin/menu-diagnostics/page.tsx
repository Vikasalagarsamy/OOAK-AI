import { MenuDebugView } from "@/components/admin/menu-debug-view"

export default function MenuDiagnosticsPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-2xl font-bold">Menu System Diagnostics</h1>
      <p className="text-gray-500">This page provides tools to diagnose and fix issues with the menu system.</p>

      <MenuDebugView />
    </div>
  )
}
