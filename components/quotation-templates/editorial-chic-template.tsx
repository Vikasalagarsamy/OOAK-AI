import React from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, Minus } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function EditorialChicTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "EDITORIAL STUDIOS"

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Magazine Style */}
      <div className="border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-black mb-2">{companyName}</h1>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-px bg-red-600"></div>
                <p className="text-red-600 text-xs uppercase font-bold tracking-[0.3em]">Photography & Film</p>
                <div className="w-12 h-px bg-red-600"></div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-black text-3xl font-bold">{quotation.quotation_number}</p>
              <p className="text-gray-600 text-sm uppercase tracking-wide">{format(new Date(quotation.created_at), "dd MMM yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-16">
        {/* Hero Editorial Spread */}
        <div className="mb-32">
          <div className="grid grid-cols-12 gap-8 items-center min-h-[70vh]">
            <div className="col-span-5">
              <div className="space-y-8">
                <div>
                  <p className="text-red-600 text-xs uppercase font-bold tracking-[0.4em] mb-6">EXCLUSIVE FEATURE</p>
                  <h2 className="text-6xl font-bold text-black leading-none mb-8">
                    THE<br />
                    <span className="text-red-600">{quotation.bride_name.toUpperCase()}</span><br />
                    <span className="font-light">&</span><br />
                    <span className="text-red-600">{quotation.groom_name.toUpperCase()}</span><br />
                    STORY
                  </h2>
                </div>
                <div className="bg-black text-white p-8">
                  <p className="text-lg font-light leading-relaxed">
                    An exclusive behind-the-scenes look at their extraordinary celebration. 
                    Where every moment becomes art, and every frame tells their unique story.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="col-span-2 flex justify-center">
              <div className="w-px h-96 bg-red-600"></div>
            </div>
            
            <div className="col-span-5">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-96 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-20 w-20 text-black mx-auto mb-6" />
                  <p className="text-black font-bold text-lg uppercase tracking-wide">FEATURED SHOOT</p>
                </div>
              </div>
              <div className="mt-8 grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <p className="text-red-600 font-bold text-lg">{quotation.mobile}</p>
                  <p className="text-gray-600 uppercase text-xs">Contact</p>
                </div>
                <div>
                  <p className="text-black font-bold text-lg">{quotationData.default_package.toUpperCase()}</p>
                  <p className="text-gray-600 uppercase text-xs">Package</p>
                </div>
                <div>
                  <p className="text-red-600 font-bold text-lg">{quotationData.events.length}</p>
                  <p className="text-gray-600 uppercase text-xs">Events</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Investment Feature */}
        <div className="mb-32">
          <div className="bg-black text-white p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 transform rotate-45 translate-x-16 -translate-y-16"></div>
            <div className="relative">
              <p className="text-red-600 text-xs uppercase font-bold tracking-[0.4em] mb-4">TOTAL INVESTMENT</p>
              <div className="flex items-baseline space-x-8">
                <h3 className="text-8xl font-bold">{formatCurrency(quotation.total_amount)}</h3>
                <div className="text-gray-300">
                  <p className="text-lg">Complete package</p>
                  <p className="text-sm">All services included</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Editorial Layout */}
        <div className="mb-32">
          <div className="mb-16">
            <div className="flex items-center space-x-6">
              <h3 className="text-3xl font-bold text-black uppercase">EVENT SCHEDULE</h3>
              <div className="flex-1 h-px bg-black"></div>
              <div className="w-8 h-8 bg-red-600 flex items-center justify-center">
                <Minus className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-16">
            {quotationData.events.map((event, index) => (
              <div key={event.id} className="grid grid-cols-12 gap-8 items-center">
                <div className="col-span-2">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-red-600 flex items-center justify-center mx-auto mb-4">
                      <span className="text-white text-3xl font-bold">{index + 1}</span>
                    </div>
                    {showEventTracking && (
                      <p className="text-xs text-red-600 uppercase font-bold">In Progress</p>
                    )}
                  </div>
                </div>
                
                <div className="col-span-4">
                  <h4 className="text-3xl font-bold text-black mb-6 uppercase tracking-tight">{event.event_name}</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-4 w-4 text-red-600" />
                      <span className="text-black font-medium">{format(new Date(event.event_date), "dd MMMM yyyy")}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Clock className="h-4 w-4 text-red-600" />
                      <span className="text-black font-medium">{event.start_time} - {event.end_time}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-black font-medium">{event.venue_name}</span>
                    </div>
                    {event.expected_crowd && (
                      <div className="flex items-center space-x-3">
                        <Users className="h-4 w-4 text-red-600" />
                        <span className="text-black font-medium">{event.expected_crowd} guests</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="col-span-6">
                  <div className="bg-gradient-to-r from-gray-100 to-gray-200 h-48 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-black font-bold text-lg uppercase">Event {index + 1}</p>
                      <p className="text-gray-600 text-sm">Photography Coverage</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Magazine Grid */}
        <div className="mb-32">
          <div className="mb-16">
            <div className="flex items-center space-x-6">
              <h3 className="text-3xl font-bold text-black uppercase">CREATIVE SERVICES</h3>
              <div className="flex-1 h-px bg-black"></div>
              <div className="w-8 h-8 bg-red-600"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {quotationData.selected_services.map((serviceItem, index) => (
              <div key={serviceItem.id} className="group">
                <div className="border-2 border-black p-8 transition-all duration-300 group-hover:bg-black group-hover:text-white">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className="text-2xl font-bold uppercase mb-2">Service {serviceItem.id}</h5>
                      <p className="text-sm uppercase tracking-wide group-hover:text-gray-300">Qty: {serviceItem.quantity}</p>
                    </div>
                    <div className="w-16 h-16 bg-red-600 flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-sm group-hover:text-gray-300">Professional photography service with artistic vision</p>
                    <p className="text-2xl font-bold">{formatCurrency(serviceItem.quantity * 5000)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables Section */}
        <div className="mb-32">
          <div className="mb-16">
            <div className="flex items-center space-x-6">
              <h3 className="text-3xl font-bold text-black uppercase">FINAL DELIVERABLES</h3>
              <div className="flex-1 h-px bg-black"></div>
              <div className="w-8 h-8 bg-red-600"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {quotationData.selected_deliverables.map((deliverableItem, index) => (
              <div key={deliverableItem.id} className="group">
                <div className="bg-red-600 text-white p-8 transition-all duration-300 group-hover:bg-black">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h5 className="text-2xl font-bold uppercase mb-2">Collection {deliverableItem.id}</h5>
                      <p className="text-sm uppercase tracking-wide">Qty: {deliverableItem.quantity}</p>
                      {showDeliverableTracking && (
                        <p className="text-xs uppercase mt-2">Status: Queued</p>
                      )}
                    </div>
                    <div className="w-16 h-16 bg-black flex items-center justify-center">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <p className="text-sm">Premium deliverable package with expert curation</p>
                    <p className="text-2xl font-bold">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms Editorial Style */}
        <div className="mb-32">
          <div className="mb-16">
            <div className="flex items-center space-x-6">
              <h3 className="text-3xl font-bold text-black uppercase">TERMS & CONDITIONS</h3>
              <div className="flex-1 h-px bg-black"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="bg-gray-100 p-8">
              <h4 className="text-xl font-bold text-black mb-6 uppercase">Payment Terms</h4>
              <div className="space-y-3 text-gray-800">
                <p>• 50% advance payment required</p>
                <p>• Balance due before shoot date</p>
                <p>• Multiple payment methods accepted</p>
                <p>• All transactions are secure</p>
              </div>
            </div>
            <div className="bg-black text-white p-8">
              <h4 className="text-xl font-bold mb-6 uppercase">Delivery Timeline</h4>
              <div className="space-y-3">
                <p>• Preview selection: 48-72 hours</p>
                <p>• Full gallery: 2-3 weeks</p>
                <p>• Physical products: 4-6 weeks</p>
                <p>• Rush delivery available</p>
              </div>
            </div>
            <div className="bg-red-600 text-white p-8">
              <h4 className="text-xl font-bold mb-6 uppercase">Additional Notes</h4>
              <div className="space-y-3">
                <p>• Quotation valid for 30 days</p>
                <p>• Travel costs included locally</p>
                <p>• Weather backup plans included</p>
                <p>• Client satisfaction guaranteed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Editorial Footer */}
        <div className="border-t-4 border-black pt-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h3 className="text-5xl font-bold text-black uppercase leading-tight mb-8">
                Ready to<br />
                <span className="text-red-600">Create</span><br />
                Magic?
              </h3>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                Let's transform your vision into extraordinary visual storytelling. 
                Contact us today to begin this incredible journey together.
              </p>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-px bg-red-600"></div>
                <p className="text-sm text-gray-600 uppercase tracking-wide">Editorial Studios</p>
                <div className="w-16 h-px bg-red-600"></div>
              </div>
            </div>
            <div className="space-y-8">
              <div className="border-2 border-black p-6 hover:bg-black hover:text-white transition-all duration-300 group">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-red-600 flex items-center justify-center">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wide group-hover:text-gray-300">Call Direct</p>
                    <p className="text-xl font-bold">{companySettings?.contactInfo?.phone || "+91 98765 43210"}</p>
                  </div>
                </div>
              </div>
              <div className="border-2 border-black p-6 hover:bg-black hover:text-white transition-all duration-300 group">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-red-600 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <p className="text-xs uppercase font-bold tracking-wide group-hover:text-gray-300">Email Studio</p>
                    <p className="text-xl font-bold">{companySettings?.contactInfo?.email || "studio@editorial.com"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 