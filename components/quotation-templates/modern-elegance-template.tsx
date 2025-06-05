import React from "react"
import { format } from "date-fns"
import { Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, Heart } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function ModernEleganceTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Atelier Studios"

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-12 py-20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-wider text-black mb-3">{companyName}</h1>
              <p className="text-gray-600 text-sm uppercase tracking-[0.25em]">Fine Art Photography</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Quotation</p>
              <p className="text-lg font-light text-black">{quotation.quotation_number}</p>
              <p className="text-xs text-gray-500 mt-2">{format(new Date(quotation.created_at), "dd.MM.yyyy")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-12 py-24">
        {/* Hero Section */}
        <div className="mb-40">
          <div className="text-center mb-16">
            <p className="text-xs text-red-600 uppercase tracking-[0.4em] mb-8">For the Beautiful Couple</p>
            <div className="relative">
              <h2 className="text-7xl font-light text-black mb-4 leading-tight">
                {quotation.bride_name}
              </h2>
              <div className="flex items-center justify-center my-8">
                <div className="w-16 h-px bg-red-600"></div>
                <Heart className="h-6 w-6 text-red-600 mx-6 fill-current" />
                <div className="w-16 h-px bg-red-600"></div>
              </div>
              <h2 className="text-7xl font-light text-black leading-tight">
                {quotation.groom_name}
              </h2>
            </div>
            <p className="text-xl text-gray-600 leading-relaxed mt-12 max-w-3xl mx-auto italic">
              "Every love story is beautiful, but yours is our favorite to tell"
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 mt-20">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Camera className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-light text-black mb-3">Contact</h3>
              <p className="text-gray-600">{quotation.mobile}</p>
              <p className="text-gray-600">{quotation.email}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Package className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-light text-black mb-3">Package</h3>
              <p className="text-red-600 font-medium text-lg">{quotationData.default_package.toUpperCase()}</p>
            </div>
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="h-12 w-12 text-red-600" />
              </div>
              <h3 className="text-lg font-light text-black mb-3">Events</h3>
              <p className="text-black font-medium text-lg">{quotationData.events.length} Special Days</p>
            </div>
          </div>
        </div>

        {/* Investment Section */}
        <div className="mb-40">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-50 to-gray-50 transform -skew-y-1"></div>
            <div className="relative bg-white border-l-4 border-red-600 p-20">
              <div className="text-center">
                <p className="text-xs text-red-600 uppercase tracking-[0.4em] mb-6">Your Investment</p>
                <h3 className="text-8xl font-light text-black mb-6">{formatCurrency(quotation.total_amount)}</h3>
                <p className="text-gray-600 text-lg italic">Complete photography experience included</p>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="mb-40">
          <div className="text-center mb-20">
            <h3 className="text-xs text-red-600 uppercase tracking-[0.4em] mb-4">Your Special Moments</h3>
            <div className="w-32 h-px bg-red-600 mx-auto"></div>
          </div>
          
          <div className="space-y-24">
            {quotationData.events.map((event, index) => (
              <div key={event.id} className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className={index % 2 === 0 ? 'order-1' : 'order-2'}>
                    <div className="text-center lg:text-left">
                      <h4 className="text-4xl font-light text-black mb-8 italic">{event.event_name}</h4>
                      {showEventTracking && (
                        <div className="mb-6">
                          <span className="text-xs text-red-600 uppercase tracking-wide">Status: In Planning</span>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-8 text-sm">
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <Calendar className="h-4 w-4 text-red-600" />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                          </div>
                          <p className="text-black font-medium">{format(new Date(event.event_date), "dd MMMM yyyy")}</p>
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <Clock className="h-4 w-4 text-red-600" />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                          </div>
                          <p className="text-black font-medium">{event.start_time} - {event.end_time}</p>
                        </div>
                        <div>
                          <div className="flex items-center space-x-3 mb-3">
                            <MapPin className="h-4 w-4 text-red-600" />
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Venue</p>
                          </div>
                          <p className="text-black font-medium">{event.venue_name}</p>
                        </div>
                        {event.expected_crowd && (
                          <div>
                            <div className="flex items-center space-x-3 mb-3">
                              <Users className="h-4 w-4 text-red-600" />
                              <p className="text-xs text-gray-500 uppercase tracking-wide">Guests</p>
                            </div>
                            <p className="text-black font-medium">{event.expected_crowd}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={index % 2 === 0 ? 'order-2' : 'order-1'}>
                    <div className="bg-gradient-to-br from-gray-50 to-red-50 h-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <span className="text-white text-2xl font-light">{index + 1}</span>
                        </div>
                        <p className="text-gray-600 italic">Event Photography</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services */}
        <div className="mb-40">
          <div className="text-center mb-20">
            <h3 className="text-xs text-red-600 uppercase tracking-[0.4em] mb-4">Our Artistry</h3>
            <div className="w-32 h-px bg-red-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {quotationData.selected_services.map((serviceItem, index) => (
              <div key={serviceItem.id} className="group">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-8 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center">
                      <Camera className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl font-light text-black">{formatCurrency(serviceItem.quantity * 5000)}</p>
                  </div>
                  <h5 className="text-xl font-light text-black mb-3">Professional Service {serviceItem.id}</h5>
                  <p className="text-gray-600 mb-4">Quantity: {serviceItem.quantity}</p>
                  <p className="text-sm text-gray-500 italic">Crafted with artistic vision and technical excellence</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deliverables */}
        <div className="mb-40">
          <div className="text-center mb-20">
            <h3 className="text-xs text-red-600 uppercase tracking-[0.4em] mb-4">Your Treasures</h3>
            <div className="w-32 h-px bg-red-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {quotationData.selected_deliverables.map((deliverableItem, index) => (
              <div key={deliverableItem.id} className="group">
                <div className="bg-gradient-to-br from-red-50 to-white border border-red-100 p-8 transition-all duration-300 group-hover:shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                      <Package className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-2xl font-light text-black">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                  </div>
                  <h5 className="text-xl font-light text-black mb-3">Premium Collection {deliverableItem.id}</h5>
                  <p className="text-gray-600 mb-4">Quantity: {deliverableItem.quantity}</p>
                  {showDeliverableTracking && (
                    <p className="text-xs text-red-600 uppercase tracking-wide">Awaiting Creation</p>
                  )}
                  <p className="text-sm text-gray-500 italic">Handcrafted memories to last a lifetime</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms */}
        <div className="mb-40">
          <div className="text-center mb-20">
            <h3 className="text-xs text-red-600 uppercase tracking-[0.4em] mb-4">Important Details</h3>
            <div className="w-32 h-px bg-red-600 mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="text-center">
              <h4 className="text-2xl font-light text-black mb-8 italic">Investment</h4>
              <div className="space-y-4 text-gray-600">
                <p>50% advance to secure your date</p>
                <p>Balance due before event day</p>
                <p>Flexible payment arrangements</p>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-light text-black mb-8 italic">Delivery</h4>
              <div className="space-y-4 text-gray-600">
                <p>Sneak peek: 3-5 days</p>
                <p>Complete gallery: 2-3 weeks</p>
                <p>Premium products: 6-8 weeks</p>
              </div>
            </div>
            <div className="text-center">
              <h4 className="text-2xl font-light text-black mb-8 italic">Experience</h4>
              <div className="space-y-4 text-gray-600">
                <p>Valid for 45 days</p>
                <p>Travel included locally</p>
                <p>Weather contingencies covered</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-100 pt-24">
          <div className="text-center">
            <h3 className="text-5xl font-light text-black mb-8 italic">Let's Begin Your Story</h3>
            <p className="text-xl text-gray-600 leading-relaxed mb-16 max-w-3xl mx-auto">
              We believe every couple deserves to have their love story told beautifully. 
              Let's create something extraordinary together.
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Phone className="h-10 w-10 text-white" />
                </div>
                <p className="text-xs text-red-600 uppercase tracking-wide mb-2">Call Us</p>
                <p className="text-lg text-black">{companySettings?.contactInfo?.phone || "+91 98765 43210"}</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <Mail className="h-10 w-10 text-white" />
                </div>
                <p className="text-xs text-red-600 uppercase tracking-wide mb-2">Email Us</p>
                <p className="text-lg text-black">{companySettings?.contactInfo?.email || "hello@atelierstudios.com"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 