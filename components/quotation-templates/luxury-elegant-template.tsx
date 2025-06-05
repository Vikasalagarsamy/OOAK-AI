import React from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Crown, Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, Award, Star } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function LuxuryElegantTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Prestige Photography"

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Luxury Header */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-amber-100">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-amber-400 to-yellow-600 rounded-full mb-6 shadow-2xl">
              <Crown className="h-12 w-12 text-white" />
            </div>
            <h1 className="text-4xl font-serif text-gray-900 mb-3">{companyName}</h1>
            <div className="flex items-center justify-center space-x-2 text-amber-600 mb-2">
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
              <Star className="h-4 w-4 fill-current" />
            </div>
            <p className="text-gray-600 italic">Capturing Elegance, Creating Legacies</p>
            <div className="mt-6 w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-16">
        {/* Elegant Quote Header */}
        <Card className="bg-gradient-to-br from-white to-amber-50 border border-amber-200 shadow-2xl mb-16">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="inline-flex items-center space-x-3 mb-6">
                <div className="w-12 h-px bg-gradient-to-r from-transparent to-amber-400"></div>
                <Award className="h-8 w-8 text-amber-600" />
                <div className="w-12 h-px bg-gradient-to-l from-transparent to-amber-400"></div>
              </div>
              
              <h2 className="text-3xl font-serif text-gray-900 mb-4">Exclusive Wedding Collection</h2>
              <p className="text-amber-700 text-lg mb-2">Quotation #{quotation.quotation_number}</p>
              <p className="text-gray-500 text-sm">{format(new Date(quotation.created_at), "EEEE, MMMM d, yyyy")}</p>
              
              <div className="mt-8 p-8 bg-gradient-to-r from-amber-400 to-yellow-500 rounded-2xl text-white shadow-xl">
                <p className="text-amber-100 text-sm mb-2">Your Investment</p>
                <p className="text-5xl font-serif font-bold">{formatCurrency(quotation.total_amount)}</p>
                <p className="text-amber-100 text-sm mt-2">Inclusive of all premium services</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Couple Dedication */}
        <Card className="bg-white border border-gray-200 shadow-xl mb-16">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8">
            <div className="text-center text-white">
              <h3 className="text-3xl font-serif mb-4">
                To the Distinguished Couple
              </h3>
              <div className="flex items-center justify-center space-x-4 text-2xl font-serif">
                <span>{quotation.bride_name}</span>
                <div className="w-8 h-px bg-amber-400"></div>
                <span>&</span>
                <div className="w-8 h-px bg-amber-400"></div>
                <span>{quotation.groom_name}</span>
              </div>
            </div>
          </div>
          <CardContent className="p-12">
            <div className="text-center mb-10">
              <p className="text-gray-700 text-lg leading-relaxed italic">
                "It is our distinguished pleasure to present this bespoke photography collection, meticulously crafted 
                for your momentous celebration. Our artisans are devoted to capturing the essence of your union with 
                unparalleled sophistication and timeless elegance."
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <Phone className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">Private Line</h4>
                <p className="text-gray-600">{quotation.mobile}</p>
                <p className="text-gray-600 text-sm">{quotation.email}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <Crown className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">Collection</h4>
                <Badge className="bg-gradient-to-r from-amber-500 to-yellow-600 text-white px-4 py-2 text-lg font-serif">
                  {quotationData.default_package.charAt(0).toUpperCase() + quotationData.default_package.slice(1)}
                </Badge>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl border border-amber-100">
                <Calendar className="h-8 w-8 text-amber-600 mx-auto mb-4" />
                <h4 className="font-semibold text-gray-800 mb-2">Occasions</h4>
                <p className="text-3xl font-serif font-bold text-gray-800">{quotationData.events.length}</p>
                <p className="text-gray-600 text-sm">Exclusive Events</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Prestigious Events */}
        <Card className="bg-white border border-gray-200 shadow-xl mb-16">
          <div className="bg-gradient-to-r from-indigo-800 to-purple-900 p-8">
            <h3 className="text-3xl font-serif text-white text-center">Your Prestigious Calendar</h3>
          </div>
          <CardContent className="p-12">
            <div className="space-y-10">
              {quotationData.events.map((event, index) => (
                <div key={event.id} className="relative">
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-yellow-600 rounded-full flex items-center justify-center text-white font-bold font-serif">
                            {index + 1}
                          </div>
                          <h4 className="text-2xl font-serif text-gray-900">{event.event_name}</h4>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-gray-700">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <Calendar className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Date</p>
                              <p className="font-medium">{format(new Date(event.event_date), "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <Clock className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Time</p>
                              <p className="font-medium">{event.start_time} - {event.end_time}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                              <MapPin className="h-5 w-5 text-amber-600" />
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Venue</p>
                              <p className="font-medium">{event.venue_name}</p>
                            </div>
                          </div>
                          {event.expected_crowd && (
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                                <Users className="h-5 w-5 text-amber-600" />
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Guests</p>
                                <p className="font-medium">{event.expected_crowd}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {showEventTracking && (
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                          In Preparation
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {index < quotationData.events.length - 1 && (
                    <div className="flex justify-center my-8">
                      <div className="w-px h-8 bg-gradient-to-b from-amber-200 to-transparent"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Premium Services */}
        <Card className="bg-white border border-gray-200 shadow-xl mb-16">
          <div className="bg-gradient-to-r from-blue-800 to-indigo-900 p-8">
            <h3 className="text-3xl font-serif text-white text-center">Exclusive Services Portfolio</h3>
          </div>
          <CardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {quotationData.selected_services.map((serviceItem, index) => (
                <div key={serviceItem.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                          <Camera className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h5 className="text-xl font-serif text-blue-900">Premium Service #{serviceItem.id}</h5>
                          <p className="text-blue-700">Quantity: {serviceItem.quantity}</p>
                        </div>
                      </div>
                      <p className="text-blue-800 text-sm italic">
                        Artisanal photography service crafted with meticulous attention to detail
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="text-2xl font-serif font-bold text-blue-900">{formatCurrency(serviceItem.quantity * 5000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Luxury Deliverables */}
        <Card className="bg-white border border-gray-200 shadow-xl mb-16">
          <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-8">
            <h3 className="text-3xl font-serif text-white text-center">Your Treasured Collection</h3>
          </div>
          <CardContent className="p-12">
            <div className="space-y-6">
              {quotationData.selected_deliverables.map((deliverableItem, index) => (
                <div key={deliverableItem.id} className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-xl flex items-center justify-center">
                        <Package className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h5 className="text-xl font-serif text-emerald-900 mb-2">Luxury Deliverable #{deliverableItem.id}</h5>
                        <p className="text-emerald-700 mb-1">Quantity: {deliverableItem.quantity}</p>
                        <p className="text-emerald-800 text-sm italic">Handcrafted with premium materials and finishing</p>
                        {showDeliverableTracking && (
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300 mt-2">
                            Awaiting Commission
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-serif font-bold text-emerald-900">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Prestigious Terms */}
        <Card className="bg-white border border-gray-200 shadow-xl mb-16">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-8">
            <h3 className="text-3xl font-serif text-white text-center">Terms of Engagement</h3>
          </div>
          <CardContent className="p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-3xl">💎</span>
                </div>
                <h4 className="text-xl font-serif text-gray-800 mb-4">Investment Terms</h4>
                <div className="text-gray-600 space-y-2">
                  <p>• 50% retainer upon agreement</p>
                  <p>• Balance before event commencement</p>
                  <p>• Premium payment options available</p>
                  <p>• Complimentary consultation included</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-3xl">⏰</span>
                </div>
                <h4 className="text-xl font-serif text-gray-800 mb-4">Delivery Schedule</h4>
                <div className="text-gray-600 space-y-2">
                  <p>• Curated previews: 7-10 days</p>
                  <p>• Complete gallery: 15-20 days</p>
                  <p>• Cinematic highlights: 25-30 days</p>
                  <p>• Premium albums: 45-60 days</p>
                </div>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-700 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <span className="text-white text-3xl">📜</span>
                </div>
                <h4 className="text-xl font-serif text-gray-800 mb-4">Exclusive Provisions</h4>
                <div className="text-gray-600 space-y-2">
                  <p>• Proposal valid for 45 days</p>
                  <p>• Luxury travel arrangements</p>
                  <p>• Weather contingency plans</p>
                  <p>• Lifetime archival guarantee</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Elegant Contact */}
        <Card className="bg-gradient-to-br from-gray-900 to-black border-0 shadow-2xl">
          <CardContent className="p-12 text-center text-white">
            <div className="mb-8">
              <Crown className="h-16 w-16 text-amber-400 mx-auto mb-6" />
              <h3 className="text-3xl font-serif mb-4">Begin Your Legacy</h3>
              <p className="text-gray-300 text-lg italic leading-relaxed max-w-3xl mx-auto">
                "We are honored to be considered for your celebration. Our commitment extends beyond photography – 
                we are custodians of your most precious moments, dedicated to creating an heirloom that will be 
                treasured for generations."
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                <Phone className="h-5 w-5 text-amber-400" />
                <span className="text-white">{companySettings?.contactInfo?.phone || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3">
                <Mail className="h-5 w-5 text-amber-400" />
                <span className="text-white">{companySettings?.contactInfo?.email || "concierge@prestigephotography.com"}</span>
              </div>
            </div>
            
            <div className="w-32 h-px bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto"></div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 