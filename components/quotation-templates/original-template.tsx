import React from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Heart, Calendar, MapPin, Clock, Users, Camera, Video, Package, Phone, Mail, Globe } from "lucide-react"
import { QuotationTemplateProps } from "./index"

interface ServiceItem {
  id: number
  servicename: string
  basic_price: number
  premium_price: number
  elite_price: number
  category: string
}

interface DeliverableItem {
  id: number
  deliverable_name: string
  basic_total_price: number
  premium_total_price: number
  elite_total_price: number
  is_main_deliverable: boolean
  service_category: string
  process_count: number
}

export default function OriginalTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Your Photography Studio"
  const brandColor = companySettings?.brandColor || "blue"

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{companyName}</h1>
                <p className="text-slate-600">Professional Photography & Videography Services</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Quotation Date</p>
              <p className="font-semibold text-slate-800">{format(new Date(quotation.created_at), "MMMM d, yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Quote Header */}
        <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold mb-2">Sales Quotation</h2>
                <p className="text-blue-100 text-lg">Quotation #{quotation.quotation_number}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-100 text-sm">Total Amount</p>
                <p className="text-4xl font-bold">{formatCurrency(quotation.total_amount)}</p>
                <p className="text-blue-100 text-sm">+ 18% GST</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Client Details */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Heart className="h-6 w-6 text-red-500 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800">Dear {quotation.bride_name} & {quotation.groom_name},</h3>
            </div>
            <p className="text-slate-600 text-lg leading-relaxed mb-6">
              Thank you for choosing us to capture your special moments. We would be honored to be a part of your celebrations. 
              Please find our services, deliverables, and package details as per your requirements below.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Contact Information</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-slate-600">
                    <Phone className="h-4 w-4 mr-3 text-blue-500" />
                    <span>{quotation.mobile}</span>
                  </div>
                  <div className="flex items-center text-slate-600">
                    <Mail className="h-4 w-4 mr-3 text-blue-500" />
                    <span>{quotation.email}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Package Selection</h4>
                <Badge variant="secondary" className="text-lg px-4 py-2 bg-blue-100 text-blue-800">
                  {quotationData.default_package.charAt(0).toUpperCase() + quotationData.default_package.slice(1)} Package
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Calendar className="h-6 w-6 text-blue-500 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800">Your Events</h3>
            </div>
            
            <div className="space-y-6">
              {quotationData.events.map((event, index) => (
                <div key={event.id} className="bg-slate-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800">{event.event_name}</h4>
                      <div className="flex items-center space-x-4 text-slate-600 mt-2">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          <span>{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      Event {index + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-600">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                      <span>{event.venue_name}, {event.event_location}</span>
                    </div>
                    {event.expected_crowd && (
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-blue-500" />
                        <span>{event.expected_crowd} people expected</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Event Tracking Status - Future Feature */}
                  {showEventTracking && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-700">Event Status:</span>
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                          Planning Phase
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services & Pricing */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Video className="h-6 w-6 text-purple-500 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800">Our Services</h3>
            </div>

            <div className="grid gap-4">
              {quotationData.selected_services.map((serviceItem) => (
                <div key={serviceItem.id} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-blue-900">Service #{serviceItem.id}</h5>
                      <p className="text-sm text-blue-700">Quantity: {serviceItem.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-900">{formatCurrency(serviceItem.quantity * 5000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <div className="flex items-center mb-6">
              <Package className="h-6 w-6 text-green-500 mr-3" />
              <h3 className="text-2xl font-bold text-slate-800">What You'll Receive</h3>
            </div>

            <div className="grid gap-4">
              {quotationData.selected_deliverables.map((deliverableItem) => (
                <div key={deliverableItem.id} className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-semibold text-green-900">Deliverable #{deliverableItem.id}</h5>
                      <p className="text-sm text-green-700">Quantity: {deliverableItem.quantity}</p>
                      
                      {/* Deliverable Tracking Status - Future Feature */}
                      {showDeliverableTracking && (
                        <div className="mt-2">
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 text-xs">
                            Not Started
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-900">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="shadow-lg border-0">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-slate-800 mb-6">Terms & Conditions</h3>
            <div className="space-y-4 text-slate-600">
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Payment Terms</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>50% advance payment required to confirm booking</li>
                  <li>Remaining 50% to be paid before or on the event day</li>
                  <li>All prices are inclusive of travel within city limits</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Delivery Timeline</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Edited photos will be delivered within 15-20 working days</li>
                  <li>Wedding highlight video within 25-30 working days</li>
                  <li>Full ceremony video within 45-60 working days</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-slate-800 mb-2">Additional Notes</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>This quotation is valid for 30 days from the date of issue</li>
                  <li>Additional travel charges may apply for outstation events</li>
                  <li>Weather conditions and other unforeseen circumstances are beyond our control</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Footer */}
        <Card className="bg-slate-800 text-white border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-4">Ready to Book? Let's Talk!</h3>
              <div className="flex items-center justify-center space-x-8">
                <div className="flex items-center">
                  <Phone className="h-5 w-5 mr-2" />
                  <span>{companySettings?.contactInfo?.phone || "+91 98765 43210"}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  <span>{companySettings?.contactInfo?.email || "info@yourphotostudio.com"}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  <span>{companySettings?.contactInfo?.website || "www.yourphotostudio.com"}</span>
                </div>
              </div>
              <p className="text-slate-300 mt-4 text-sm">
                Thank you for considering us for your special day. We look forward to creating beautiful memories together!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 