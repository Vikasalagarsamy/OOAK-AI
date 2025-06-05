import React from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building, Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, FileText, CheckCircle } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function ClassicProfessionalTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Professional Photography Services"

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Corporate Header */}
      <div className="bg-white border-b-2 border-blue-800">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-blue-800 rounded-lg flex items-center justify-center">
                <Building className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{companyName}</h1>
                <p className="text-gray-600 text-lg">Professional Photography & Videography Solutions</p>
                <p className="text-gray-500 text-sm">Est. 2020 | Trusted by 500+ Clients</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 uppercase tracking-wide">Document Date</p>
              <p className="text-lg font-semibold text-gray-900">{format(new Date(quotation.created_at), "MMMM d, yyyy")}</p>
              <p className="text-sm text-gray-500">Reference: {quotation.quotation_number}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-12 space-y-12">
        {/* Professional Quote Header */}
        <Card className="bg-white border border-gray-300 shadow-lg">
          <div className="bg-blue-800 text-white p-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold mb-2">PROFESSIONAL QUOTATION</h2>
              <p className="text-blue-100">For Photography & Videography Services</p>
            </div>
          </div>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">CLIENT INFORMATION</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Client Name</label>
                    <p className="text-lg font-semibold text-gray-900">{quotation.client_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Couple</label>
                    <p className="text-lg text-gray-900">{quotation.bride_name} & {quotation.groom_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Contact Information</label>
                    <p className="text-gray-900">{quotation.mobile}</p>
                    <p className="text-gray-900">{quotation.email}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">QUOTATION DETAILS</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Quotation Number</label>
                    <p className="text-lg font-semibold text-gray-900">{quotation.quotation_number}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Package Type</label>
                    <Badge variant="outline" className="text-blue-800 border-blue-800 font-semibold">
                      {quotationData.default_package.toUpperCase()} PACKAGE
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Events</label>
                    <p className="text-lg font-semibold text-gray-900">{quotationData.events.length} Event(s)</p>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-6">
                    <label className="text-sm font-medium text-blue-800 uppercase tracking-wide">Total Amount</label>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(quotation.total_amount)}</p>
                    <p className="text-sm text-blue-700">Plus applicable taxes (18% GST)</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Events Schedule */}
        <Card className="bg-white border border-gray-300 shadow-lg">
          <div className="bg-gray-800 text-white p-6">
            <h3 className="text-2xl font-bold text-center">EVENT SCHEDULE & DETAILS</h3>
          </div>
          <CardContent className="p-10">
            <div className="space-y-8">
              {quotationData.events.map((event, index) => (
                <div key={event.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-100 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xl font-bold text-gray-900">
                        EVENT {index + 1}: {event.event_name.toUpperCase()}
                      </h4>
                      {showEventTracking && (
                        <Badge className="bg-green-600 text-white">
                          Status: Planning Phase
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-500 uppercase">Date</label>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">
                          {format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-5 w-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-500 uppercase">Duration</label>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{event.start_time} - {event.end_time}</p>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <MapPin className="h-5 w-5 text-blue-600" />
                          <label className="text-sm font-medium text-gray-500 uppercase">Venue</label>
                        </div>
                        <p className="text-lg font-semibold text-gray-900">{event.venue_name}</p>
                        <p className="text-gray-600">{event.event_location}</p>
                      </div>
                      {event.expected_crowd && (
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            <label className="text-sm font-medium text-gray-500 uppercase">Expected Attendance</label>
                          </div>
                          <p className="text-lg font-semibold text-gray-900">{event.expected_crowd} Guests</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Professional Services */}
        <Card className="bg-white border border-gray-300 shadow-lg">
          <div className="bg-blue-600 text-white p-6">
            <h3 className="text-2xl font-bold text-center">PROFESSIONAL SERVICES INCLUDED</h3>
          </div>
          <CardContent className="p-10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Service Description</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Quantity</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Unit Rate</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.selected_services.map((serviceItem, index) => (
                    <tr key={serviceItem.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Camera className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Professional Photography Service #{serviceItem.id}</p>
                            <p className="text-sm text-gray-600">High-quality professional photography coverage</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold">{serviceItem.quantity}</td>
                      <td className="py-4 px-4 text-right font-semibold">{formatCurrency(5000)}</td>
                      <td className="py-4 px-4 text-right font-bold text-blue-900">{formatCurrency(serviceItem.quantity * 5000)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Professional Deliverables */}
        <Card className="bg-white border border-gray-300 shadow-lg">
          <div className="bg-green-600 text-white p-6">
            <h3 className="text-2xl font-bold text-center">DELIVERABLES & FINAL PRODUCTS</h3>
          </div>
          <CardContent className="p-10">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-300">
                    <th className="text-left py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Deliverable Description</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Quantity</th>
                    <th className="text-center py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Status</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-900 uppercase tracking-wide">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {quotationData.selected_deliverables.map((deliverableItem, index) => (
                    <tr key={deliverableItem.id} className={`border-b border-gray-200 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <Package className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="font-semibold text-gray-900">Premium Deliverable Package #{deliverableItem.id}</p>
                            <p className="text-sm text-gray-600">Professional grade final products and materials</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold">{deliverableItem.quantity}</td>
                      <td className="py-4 px-4 text-center">
                        {showDeliverableTracking ? (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                            Pending Event
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-400">
                            To Be Scheduled
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-green-900">{formatCurrency(deliverableItem.quantity * 8000)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Professional Terms */}
        <Card className="bg-white border border-gray-300 shadow-lg">
          <div className="bg-gray-800 text-white p-6">
            <h3 className="text-2xl font-bold text-center">TERMS AND CONDITIONS</h3>
          </div>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  PAYMENT TERMS
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    50% advance payment required upon contract signing
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Remaining 50% due before commencement of services
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Accepted payment methods: Bank transfer, Cheque, UPI
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    All prices inclusive of equipment and standard travel
                  </li>
                </ul>

                <h4 className="text-lg font-bold text-gray-900 mb-4 mt-8 flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-600" />
                  DELIVERY SCHEDULE
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Preview gallery: 5-7 business days post-event
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Complete edited collection: 15-20 business days
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Video highlights: 25-30 business days
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Physical products: 45-60 business days
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Building className="h-5 w-5 mr-2 text-blue-600" />
                  GENERAL CONDITIONS
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Quotation validity: 30 days from date of issue
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Additional travel charges for venues beyond 50km
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Force majeure conditions are beyond our control
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Booking confirmation subject to date availability
                  </li>
                </ul>

                <h4 className="text-lg font-bold text-gray-900 mb-4 mt-8 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" />
                  SERVICE GUARANTEE
                </h4>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Professional quality assurance on all deliverables
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Backup equipment and redundancy systems
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Data backup and archival for 2 years minimum
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-1 flex-shrink-0" />
                    Customer satisfaction guarantee
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Professional Contact */}
        <Card className="bg-blue-800 text-white border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <h3 className="text-2xl font-bold mb-6">READY TO PROCEED?</h3>
            <p className="text-blue-100 text-lg mb-8 max-w-3xl mx-auto">
              We appreciate your interest in our professional photography services. 
              Our team is committed to delivering exceptional results that exceed your expectations. 
              Please contact us to discuss your requirements and confirm your booking.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
              <div className="bg-blue-700 rounded-lg p-6">
                <Phone className="h-8 w-8 mx-auto mb-4" />
                <h4 className="font-bold mb-2">PHONE CONSULTATION</h4>
                <p className="text-blue-100">{companySettings?.contactInfo?.phone || "+91 98765 43210"}</p>
                <p className="text-sm text-blue-200 mt-1">Mon-Sat: 9:00 AM - 7:00 PM</p>
              </div>
              <div className="bg-blue-700 rounded-lg p-6">
                <Mail className="h-8 w-8 mx-auto mb-4" />
                <h4 className="font-bold mb-2">EMAIL INQUIRY</h4>
                <p className="text-blue-100">{companySettings?.contactInfo?.email || "info@professionalphotography.com"}</p>
                <p className="text-sm text-blue-200 mt-1">Response within 24 hours</p>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-blue-700">
              <p className="text-blue-200 text-sm">
                This quotation supersedes all previous estimates and remains valid for 30 days from the date of issue. 
                All services are subject to our standard terms and conditions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 