import { MenuDebugger } from "@/components/debug/menu-debugger"

export default function MenuDebugPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Menu System Diagnostics</h1>
      <MenuDebugger />
    </div>
  )
}
