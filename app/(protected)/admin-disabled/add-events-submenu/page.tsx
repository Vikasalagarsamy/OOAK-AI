import { AddEventsSubmenuButton } from "@/components/admin/add-events-submenu-button"

export default function AddEventsSubmenuPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Add Events Submenu Item</h1>

      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="mb-4">
          This utility will add an &quot;Events&quot; submenu item to the Event Coordination menu. The submenu will link
          to the /events page where users can manage event names and details.
        </p>

        <div className="mt-6">
          <AddEventsSubmenuButton />
        </div>
      </div>
    </div>
  )
}
