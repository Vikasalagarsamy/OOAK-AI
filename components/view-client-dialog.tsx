"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import type { Client } from "@/types/client"
import { PhoneIcon } from "lucide-react"

interface ViewClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client
}

export function ViewClientDialog({ open, onOpenChange, client }: ViewClientDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Client Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">{client.name}</h2>
              <p className="text-sm text-gray-500">{client.client_code}</p>
            </div>
            <Badge variant={client.status === "ACTIVE" ? "default" : "secondary"}>{client.status}</Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Company</h3>
              <p>{client.company_name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">Category</h3>
              <p>{client.category}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500">Contact Person</h3>
            <p>{client.contact_person}</p>
          </div>

          {client.email && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Email</h3>
              <p>{client.email}</p>
            </div>
          )}

          {client.phone && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Phone</h3>
              <div className="flex items-center gap-2">
                <p>
                  {client.country_code || "+91"} {client.phone}
                </p>
                {client.is_whatsapp && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    <span className="flex items-center gap-1">
                      <PhoneIcon className="h-3 w-3" />
                      WhatsApp
                    </span>
                  </Badge>
                )}
              </div>
            </div>
          )}

          {client.address && (
            <div>
              <h3 className="text-sm font-medium text-gray-500">Address</h3>
              <p>{client.address}</p>
              <p>
                {client.city}
                {client.state && `, ${client.state}`}
                {client.postal_code && ` ${client.postal_code}`}
                {client.country && `, ${client.country}`}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
