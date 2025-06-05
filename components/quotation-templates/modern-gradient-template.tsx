import React from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Heart, Calendar, MapPin, Clock, Users, Camera, Sparkles, Star, Package, Phone, Mail, Globe, Instagram } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function ModernGradientTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Modern Photography Studio"

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Floating Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-10"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full mb-4 shadow-xl">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
              {companyName}
            </h1>
            <p className="text-gray-600 text-lg">Creating magical moments, one frame at a time</p>
          </div>

          {/* Floating Quote Card */}
          <Card className="bg-white/80 backdrop-blur-lg border-0 shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 p-1">
              <div className="bg-white rounded-3xl p-8">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Dream Wedding Quotation</h2>
                  <p className="text-gray-600 mb-4">Quotation #{quotation.quotation_number}</p>
                  <div className="inline-flex items-center space-x-2 text-sm text-gray-500 mb-6">
                    <Calendar className="h-4 w-4" />
                    <span>Created on {format(new Date(quotation.created_at), "MMMM d, yyyy")}</span>
                  </div>
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
                    <p className="text-purple-100 text-sm mb-2">Total Investment</p>
                    <p className="text-4xl font-bold">{formatCurrency(quotation.total_amount)}</p>
                    <p className="text-purple-100 text-sm mt-1">+ 18% GST | All inclusive</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Couple Details */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6">
            <div className="flex items-center justify-center space-x-3 text-white">
              <Heart className="h-8 w-8" />
              <h3 className="text-3xl font-bold">
                {quotation.bride_name} & {quotation.groom_name}
              </h3>
              <Heart className="h-8 w-8" />
            </div>
          </div>
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <p className="text-gray-600 text-lg leading-relaxed">
                Congratulations on your upcoming celebration! ✨ We're absolutely thrilled to be part of your love story. 
                Our team is dedicated to capturing every precious moment with artistic vision and heartfelt care.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                <Phone className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Contact</h4>
                <p className="text-gray-600">{quotation.mobile}</p>
                <p className="text-gray-600 text-sm">{quotation.email}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-pink-50 to-orange-50 rounded-2xl">
                <Star className="h-8 w-8 text-pink-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Package</h4>
                <Badge className="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 text-lg">
                  {quotationData.default_package.charAt(0).toUpperCase() + quotationData.default_package.slice(1)}
                </Badge>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl">
                <Calendar className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-800 mb-2">Events</h4>
                <p className="text-2xl font-bold text-gray-800">{quotationData.events.length}</p>
                <p className="text-gray-600 text-sm">Special moments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events Timeline */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6">
            <h3 className="text-3xl font-bold text-white text-center">Your Celebration Timeline</h3>
          </div>
          <CardContent className="p-8">
            <div className="space-y-6">
              {quotationData.events.map((event, index) => (
                <div key={event.id} className="relative">
                  {/* Timeline connector */}
                  {index < quotationData.events.length - 1 && (
                    <div className="absolute left-6 top-16 w-0.5 h-20 bg-gradient-to-b from-purple-300 to-pink-300"></div>
                  )}
                  
                  <div className="flex items-start space-x-6">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                        {index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-2xl font-bold text-gray-800">{event.event_name}</h4>
                        {showEventTracking && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white">
                            Planning
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                            <Calendar className="h-4 w-4 text-purple-600" />
                          </div>
                          <span className="font-medium">{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center">
                            <Clock className="h-4 w-4 text-pink-600" />
                          </div>
                          <span>{event.start_time} - {event.end_time}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                            <MapPin className="h-4 w-4 text-orange-600" />
                          </div>
                          <span>{event.venue_name}, {event.event_location}</span>
                        </div>
                        {event.expected_crowd && (
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Users className="h-4 w-4 text-blue-600" />
                            </div>
                            <span>{event.expected_crowd} guests</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6">
            <h3 className="text-3xl font-bold text-white text-center">Our Premium Services</h3>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quotationData.selected_services.map((serviceItem, index) => (
                <div key={serviceItem.id} className="group">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-2xl p-6 transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white" />
                      </div>
                      <Badge variant="outline" className="bg-white text-blue-600 border-blue-200">
                        Qty: {serviceItem.quantity}
                      </Badge>
                    </div>
                    <h5 className="font-bold text-blue-900 text-lg mb-2">Professional Service #{serviceItem.id}</h5>
                    <p className="text-blue-700 text-sm mb-4">Premium photography service included in your package</p>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">{formatCurrency(serviceItem.quantity * 5000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deliverables */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6">
            <h3 className="text-3xl font-bold text-white text-center">Your Beautiful Memories</h3>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quotationData.selected_deliverables.map((deliverableItem, index) => (
                <div key={deliverableItem.id} className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-100 rounded-2xl p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-white" />
                        </div>
                        <h5 className="font-bold text-emerald-900 text-lg">Premium Deliverable #{deliverableItem.id}</h5>
                      </div>
                      <p className="text-emerald-700 text-sm mb-3">Quantity: {deliverableItem.quantity}</p>
                      {showDeliverableTracking && (
                        <Badge variant="outline" className="bg-gray-50 text-gray-600 text-xs">
                          Awaiting Event
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-emerald-900">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modern Terms */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6">
            <h3 className="text-3xl font-bold text-white text-center">Important Information</h3>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">💰</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3">Payment Terms</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• 50% advance to book</li>
                  <li>• Balance before event</li>
                  <li>• Multiple payment options</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">⏱️</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3">Delivery Timeline</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Photos: 15-20 days</li>
                  <li>• Highlights: 25-30 days</li>
                  <li>• Full videos: 45-60 days</li>
                </ul>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-2xl">📋</span>
                </div>
                <h4 className="font-bold text-gray-800 mb-3">Additional Notes</h4>
                <ul className="text-gray-600 text-sm space-y-1">
                  <li>• Valid for 30 days</li>
                  <li>• Travel charges extra</li>
                  <li>• Weather backup plans</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-8 text-center text-white">
            <div className="mb-6">
              <h3 className="text-3xl font-bold mb-2">Ready to Capture Magic? ✨</h3>
              <p className="text-purple-100 text-lg">Let's start planning your perfect day together!</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-6 mb-6">
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Phone className="h-5 w-5" />
                <span>{companySettings?.contactInfo?.phone || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Mail className="h-5 w-5" />
                <span>{companySettings?.contactInfo?.email || "hello@modernstudio.com"}</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                <Instagram className="h-5 w-5" />
                <span>@modernstudio</span>
              </div>
            </div>
            
            <p className="text-purple-100 text-sm leading-relaxed">
              Every love story is unique, and we're honored to be part of yours. From the first glance to the last dance, 
              we'll be there to capture every magical moment with artistry and passion. 
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 