import React from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, ArrowRight } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function InternationalModernTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Studio International"

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-12 py-16">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-light tracking-wider text-gray-900 mb-2">{companyName}</h1>
              <p className="text-gray-500 text-sm uppercase tracking-[0.2em]">Photography Studio</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Quotation</p>
              <p className="text-sm font-medium text-gray-900">{quotation.quotation_number}</p>
              <p className="text-xs text-gray-500 mt-2">{format(new Date(quotation.created_at), "dd.MM.yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-12 py-20">
        {/* Hero Section */}
        <div className="mb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-8">For the couple</p>
              <h2 className="text-4xl lg:text-5xl font-light text-gray-900 mb-8 leading-tight">
                {quotation.bride_name} <br />
                <span className="text-gray-400">&</span> <br />
                {quotation.groom_name}
              </h2>
              <div className="space-y-4 text-gray-600">
                <p className="text-lg leading-relaxed">
                  Thank you for considering us to document your special celebration. 
                  We are honored to potentially be part of your story.
                </p>
                <div className="pt-8">
                  <div className="grid grid-cols-2 gap-8 text-sm">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Contact</p>
                      <p>{quotation.mobile}</p>
                      <p>{quotation.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Package</p>
                      <p className="font-medium">{quotationData.default_package.toUpperCase()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="bg-gray-50 h-96 flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-300" />
              </div>
            </div>
          </div>
        </div>

        {/* Investment Summary */}
        <div className="mb-32">
          <div className="border border-gray-200 p-16">
            <div className="text-center">
              <p className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-4">Total Investment</p>
              <h3 className="text-6xl font-light text-gray-900 mb-4">{formatCurrency(quotation.total_amount)}</h3>
              <p className="text-gray-500 text-sm">Inclusive of all services and deliverables</p>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="mb-32">
          <div className="mb-16">
            <h3 className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-2">Your Events</h3>
            <div className="w-24 h-px bg-gray-200"></div>
          </div>
          
          <div className="space-y-20">
            {quotationData.events.map((event, index) => (
              <div key={event.id} className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div>
                  <h4 className="text-2xl font-light text-gray-900 mb-8">{event.event_name}</h4>
                  {showEventTracking && (
                    <div className="mb-6">
                      <span className="text-xs text-gray-400 uppercase tracking-wide">Status: Planning</span>
                    </div>
                  )}
                </div>
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Date</p>
                      </div>
                      <p className="text-gray-900">{format(new Date(event.event_date), "dd MMM yyyy")}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Time</p>
                      </div>
                      <p className="text-gray-900">{event.start_time} - {event.end_time}</p>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Venue</p>
                      </div>
                      <p className="text-gray-900">{event.venue_name}</p>
                    </div>
                    {event.expected_crowd && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <p className="text-xs text-gray-400 uppercase tracking-wide">Guests</p>
                        </div>
                        <p className="text-gray-900">{event.expected_crowd}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-32">
          <div className="mb-16">
            <h3 className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-2">Professional Services</h3>
            <div className="w-24 h-px bg-gray-200"></div>
          </div>
          
          <div className="space-y-8">
            {quotationData.selected_services.map((serviceItem, index) => (
              <div key={serviceItem.id} className="flex items-center justify-between py-6 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Camera className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Photography Service {serviceItem.id}</p>
                    <p className="text-sm text-gray-500">Quantity: {serviceItem.quantity}</p>
                  </div>
                </div>
                <p className="text-lg font-light text-gray-900">{formatCurrency(serviceItem.quantity * 5000)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-32">
          <div className="mb-16">
            <h3 className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-2">Deliverables</h3>
            <div className="w-24 h-px bg-gray-200"></div>
          </div>
          
          <div className="space-y-8">
            {quotationData.selected_deliverables.map((deliverableItem, index) => (
              <div key={deliverableItem.id} className="flex items-center justify-between py-6 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-gray-900 font-medium">Deliverable Package {deliverableItem.id}</p>
                    <p className="text-sm text-gray-500">Quantity: {deliverableItem.quantity}</p>
                    {showDeliverableTracking && (
                      <p className="text-xs text-gray-400 mt-1">Status: Pending</p>
                    )}
                  </div>
                </div>
                <p className="text-lg font-light text-gray-900">{formatCurrency(deliverableItem.quantity * 8000)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Terms Grid */}
        <div className="mb-32">
          <div className="mb-16">
            <h3 className="text-xs text-gray-400 uppercase tracking-[0.3em] mb-2">Terms & Information</h3>
            <div className="w-24 h-px bg-gray-200"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div>
              <h4 className="text-lg font-light text-gray-900 mb-6">Payment</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>50% advance to confirm booking</p>
                <p>Remaining 50% before event commencement</p>
                <p>Multiple payment options available</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-light text-gray-900 mb-6">Delivery</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Preview gallery: 5-7 days</p>
                <p>Complete collection: 15-20 days</p>
                <p>Premium products: 45-60 days</p>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-light text-gray-900 mb-6">Notes</h4>
              <div className="space-y-3 text-sm text-gray-600">
                <p>Quotation valid for 30 days</p>
                <p>Travel charges apply beyond city limits</p>
                <p>Weather backup plans included</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="border-t border-gray-200 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h3 className="text-3xl font-light text-gray-900 mb-8">Let's create something beautiful together</h3>
              <p className="text-gray-600 text-lg leading-relaxed mb-8">
                We would be honored to document your special day. Please reach out to discuss 
                your vision and confirm your booking.
              </p>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <ArrowRight className="h-4 w-4" />
                <span>Ready to begin your journey</span>
              </div>
            </div>
            <div className="space-y-8">
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Phone className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Phone</p>
                  <p className="text-gray-900">{companySettings?.contactInfo?.phone || "+91 98765 43210"}</p>
                </div>
              </div>
              <div className="flex items-center space-x-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Email</p>
                  <p className="text-gray-900">{companySettings?.contactInfo?.email || "hello@studiointernational.com"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 