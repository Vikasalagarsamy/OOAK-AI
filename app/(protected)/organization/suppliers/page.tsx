import { SupplierList } from "@/components/supplier-list"

export default function SuppliersPage() {
  return (
    <main className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-bold mb-2">Supplier Management</h1>
        <p className="text-muted-foreground">Manage your suppliers and their information.</p>
      </div>

      <div className="max-w-6xl mx-auto">
        <SupplierList />
      </div>
    </main>
  )
}
