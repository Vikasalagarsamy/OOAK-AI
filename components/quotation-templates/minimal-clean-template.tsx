import React from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function MinimalCleanTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Studio Minimal"

  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl font-light text-gray-900 mb-2">{companyName}</h1>
            <p className="text-gray-500 text-sm tracking-wide uppercase">Photography Studio</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-16">
        {/* Quote Header */}
        <div className="text-center mb-16">
          <h2 className="text-5xl font-light text-gray-900 mb-4">Quotation</h2>
          <p className="text-gray-500 text-lg"># {quotation.quotation_number}</p>
          <p className="text-gray-400 text-sm mt-2">{format(new Date(quotation.created_at), "MMMM d, yyyy")}</p>
          
          <div className="mt-12 pt-8 border-t border-gray-100">
            <p className="text-6xl font-light text-gray-900">{formatCurrency(quotation.total_amount)}</p>
            <p className="text-gray-500 text-sm mt-2">Total Amount (+ 18% GST)</p>
          </div>
        </div>

        {/* Client Details */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-light text-gray-900 mb-4">
              {quotation.bride_name} & {quotation.groom_name}
            </h3>
            <div className="w-16 h-0.5 bg-gray-200 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div>
              <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-3">Contact</h4>
              <p className="text-gray-700 mb-1">{quotation.mobile}</p>
              <p className="text-gray-700">{quotation.email}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-400 uppercase tracking-wide mb-3">Package</h4>
              <p className="text-gray-900 font-medium">
                {quotationData.default_package.charAt(0).toUpperCase() + quotationData.default_package.slice(1)} Package
              </p>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-light text-gray-900 mb-4">Events</h3>
            <div className="w-16 h-0.5 bg-gray-200 mx-auto"></div>
          </div>
          
          <div className="space-y-12">
            {quotationData.events.map((event, index) => (
              <div key={event.id} className="text-center">
                <h4 className="text-xl font-light text-gray-900 mb-6">{event.event_name}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                  <div>
                    <Calendar className="h-4 w-4 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">{format(new Date(event.event_date), "MMM d, yyyy")}</p>
                  </div>
                  <div>
                    <Clock className="h-4 w-4 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">{event.start_time} - {event.end_time}</p>
                  </div>
                  <div>
                    <MapPin className="h-4 w-4 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">{event.venue_name}</p>
                  </div>
                  {event.expected_crowd && (
                    <div>
                      <Users className="h-4 w-4 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">{event.expected_crowd} guests</p>
                    </div>
                  )}
                </div>

                {showEventTracking && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Status: Planning</p>
                  </div>
                )}

                {index < quotationData.events.length - 1 && (
                  <div className="mt-12 pt-8 border-t border-gray-100"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-light text-gray-900 mb-4">Services</h3>
            <div className="w-16 h-0.5 bg-gray-200 mx-auto"></div>
          </div>
          
          <div className="space-y-6">
            {quotationData.selected_services.map((serviceItem) => (
              <div key={serviceItem.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Camera className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900">Photography Service #{serviceItem.id}</p>
                    <p className="text-sm text-gray-500">Quantity: {serviceItem.quantity}</p>
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{formatCurrency(serviceItem.quantity * 5000)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-light text-gray-900 mb-4">Deliverables</h3>
            <div className="w-16 h-0.5 bg-gray-200 mx-auto"></div>
          </div>
          
          <div className="space-y-6">
            {quotationData.selected_deliverables.map((deliverableItem) => (
              <div key={deliverableItem.id} className="flex items-center justify-between py-4 border-b border-gray-100">
                <div className="flex items-center space-x-4">
                  <Package className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-900">Deliverable #{deliverableItem.id}</p>
                    <p className="text-sm text-gray-500">Quantity: {deliverableItem.quantity}</p>
                    {showDeliverableTracking && (
                      <p className="text-xs text-gray-400 mt-1">Status: Pending</p>
                    )}
                  </div>
                </div>
                <p className="text-gray-900 font-medium">{formatCurrency(deliverableItem.quantity * 8000)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-light text-gray-900 mb-4">Terms</h3>
            <div className="w-16 h-0.5 bg-gray-200 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center text-sm">
            <div>
              <h4 className="text-gray-900 font-medium mb-3">Payment</h4>
              <div className="text-gray-600 space-y-1">
                <p>50% advance required</p>
                <p>Balance before event</p>
                <p>Multiple payment methods</p>
              </div>
            </div>
            <div>
              <h4 className="text-gray-900 font-medium mb-3">Delivery</h4>
              <div className="text-gray-600 space-y-1">
                <p>Photos: 15-20 days</p>
                <p>Videos: 25-30 days</p>
                <p>Full album: 45-60 days</p>
              </div>
            </div>
            <div>
              <h4 className="text-gray-900 font-medium mb-3">Validity</h4>
              <div className="text-gray-600 space-y-1">
                <p>30 days from issue</p>
                <p>Travel charges extra</p>
                <p>Subject to availability</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="text-center pt-16 border-t border-gray-100">
          <h3 className="text-xl font-light text-gray-900 mb-8">Let's create something beautiful together</h3>
          
          <div className="flex items-center justify-center space-x-12 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4" />
              <span>{companySettings?.contactInfo?.phone || "+91 98765 43210"}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>{companySettings?.contactInfo?.email || "hello@studiominimal.com"}</span>
            </div>
          </div>
          
          <p className="text-gray-400 text-xs mt-8 leading-relaxed max-w-2xl mx-auto">
            Thank you for considering our studio for your special day. We believe in capturing authentic moments 
            with timeless elegance and minimal interference, allowing your story to unfold naturally.
          </p>
        </div>
      </div>
    </div>
  )
} 