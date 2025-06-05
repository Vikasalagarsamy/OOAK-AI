import React from "react"
import { format } from "date-fns"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Palette, Calendar, MapPin, Clock, Users, Camera, Package, Phone, Mail, Zap, Rainbow, Sparkles } from "lucide-react"
import { QuotationTemplateProps } from "./index"

export default function CreativeColorfulTemplate({ 
  quotation, 
  showEventTracking = false, 
  showDeliverableTracking = false,
  companySettings 
}: QuotationTemplateProps) {
  const quotationData = quotation.quotation_data

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`
  }

  const companyName = companySettings?.companyName || "Creative Lens Studio"

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 via-blue-50 via-green-50 to-yellow-100">
      {/* Vibrant Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-pink-400 via-purple-500 via-blue-500 via-green-500 to-yellow-400 opacity-20"></div>
        <div className="relative max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="relative inline-block mb-8">
              <div className="w-32 h-32 bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 rounded-full flex items-center justify-center shadow-2xl animate-pulse">
                <Palette className="h-16 w-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              {companyName}
            </h1>
            <p className="text-2xl text-gray-700 mb-6">🎨 Where Creativity Meets Photography ✨</p>
            <div className="flex items-center justify-center space-x-4 text-4xl">
              <span>🌈</span>
              <span>📸</span>
              <span>💫</span>
              <span>🎭</span>
              <span>🎨</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
        {/* Colorful Quote Header */}
        <Card className="bg-white border-0 shadow-2xl rounded-3xl overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-green-500 p-2">
            <div className="bg-white rounded-2xl p-10">
              <div className="text-center">
                <div className="mb-6">
                  <Rainbow className="h-12 w-12 text-pink-500 mx-auto mb-4" />
                  <h2 className="text-4xl font-bold text-gray-800 mb-2">Your Colorful Journey Awaits! 🎉</h2>
                  <p className="text-pink-600 text-xl">Quotation #{quotation.quotation_number}</p>
                  <p className="text-gray-500">{format(new Date(quotation.created_at), "EEEE, MMMM d, yyyy")}</p>
                </div>
                
                <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 rounded-3xl p-8 text-white shadow-xl transform -rotate-2">
                  <p className="text-orange-100 text-lg mb-2">🎯 Total Creative Package</p>
                  <p className="text-6xl font-bold">{formatCurrency(quotation.total_amount)}</p>
                  <p className="text-orange-100 text-lg mt-2">All the magic included! ✨</p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Fun Couple Section */}
        <Card className="bg-gradient-to-br from-pink-50 to-purple-50 border-4 border-pink-200 shadow-xl rounded-3xl overflow-hidden transform -rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6">
            <div className="text-center text-white">
              <h3 className="text-4xl font-bold mb-4">💕 The Amazing Couple 💕</h3>
              <div className="text-3xl font-bold">
                <span className="bg-yellow-400 text-purple-900 px-4 py-2 rounded-full inline-block transform rotate-2 mr-4">
                  {quotation.bride_name} 👰
                </span>
                <span className="text-4xl mx-4">+</span>
                <span className="bg-blue-400 text-white px-4 py-2 rounded-full inline-block transform -rotate-2">
                  {quotation.groom_name} 🤵
                </span>
              </div>
            </div>
          </div>
          <CardContent className="p-10">
            <div className="text-center mb-8">
              <p className="text-gray-700 text-xl leading-relaxed">
                🎊 WOOHOO! We're absolutely PUMPED to capture your incredible love story! 
                Get ready for an adventure filled with laughter, creativity, and absolutely stunning photos! 
                Let's make some magic together! 🌟
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center p-6 bg-gradient-to-br from-green-100 to-blue-100 rounded-2xl border-4 border-green-300 transform rotate-2">
                <Phone className="h-10 w-10 text-green-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-2">📞 Let's Chat!</h4>
                <p className="text-gray-600">{quotation.mobile}</p>
                <p className="text-gray-600 text-sm">{quotation.email}</p>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-2xl border-4 border-yellow-300">
                <Zap className="h-10 w-10 text-yellow-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-2">⚡ Package Power!</h4>
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-3 text-xl font-bold rounded-full">
                  {quotationData.default_package.charAt(0).toUpperCase() + quotationData.default_package.slice(1)} ✨
                </Badge>
              </div>
              <div className="text-center p-6 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl border-4 border-purple-300 transform -rotate-2">
                <Calendar className="h-10 w-10 text-purple-600 mx-auto mb-4" />
                <h4 className="font-bold text-gray-800 mb-2">🎭 Epic Events</h4>
                <p className="text-4xl font-bold text-purple-800">{quotationData.events.length}</p>
                <p className="text-purple-600 font-medium">Days of Fun!</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Playful Events */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 p-8">
            <h3 className="text-4xl font-bold text-white text-center">🎪 Your Event Extravaganza! 🎪</h3>
          </div>
          <CardContent className="p-10">
            <div className="space-y-8">
              {quotationData.events.map((event, index) => {
                const colors = [
                  'from-red-400 to-pink-500',
                  'from-blue-400 to-purple-500',
                  'from-green-400 to-blue-500',
                  'from-yellow-400 to-orange-500',
                  'from-purple-400 to-pink-500'
                ]
                const bgColors = [
                  'from-red-50 to-pink-50 border-red-200',
                  'from-blue-50 to-purple-50 border-blue-200',
                  'from-green-50 to-blue-50 border-green-200',
                  'from-yellow-50 to-orange-50 border-yellow-200',
                  'from-purple-50 to-pink-50 border-purple-200'
                ]
                
                return (
                  <div key={event.id} className={`bg-gradient-to-br ${bgColors[index % bgColors.length]} border-4 rounded-3xl p-8 transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform duration-300`}>
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex items-center space-x-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${colors[index % colors.length]} rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-xl`}>
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="text-3xl font-bold text-gray-800 mb-2">{event.event_name} 🎉</h4>
                          {showEventTracking && (
                            <Badge className="bg-gradient-to-r from-green-400 to-blue-500 text-white px-4 py-2 rounded-full">
                              🚀 Getting Ready!
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <Calendar className="h-6 w-6 text-indigo-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">📅 Date</p>
                        <p className="font-bold text-gray-800">{format(new Date(event.event_date), "MMM d")}</p>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <Clock className="h-6 w-6 text-green-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">⏰ Time</p>
                        <p className="font-bold text-gray-800">{event.start_time}</p>
                      </div>
                      <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center">
                        <MapPin className="h-6 w-6 text-pink-600 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">📍 Venue</p>
                        <p className="font-bold text-gray-800">{event.venue_name}</p>
                      </div>
                      {event.expected_crowd && (
                        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 text-center">
                          <Users className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-1">👥 Crowd</p>
                          <p className="font-bold text-gray-800">{event.expected_crowd}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Creative Services */}
        <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-4 border-cyan-200 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-cyan-500 to-blue-600 p-8">
            <h3 className="text-4xl font-bold text-white text-center">📸 Our Creative Arsenal! 🎨</h3>
          </div>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {quotationData.selected_services.map((serviceItem, index) => {
                const serviceColors = [
                  'from-pink-400 to-rose-500',
                  'from-blue-400 to-indigo-500',
                  'from-green-400 to-emerald-500',
                  'from-yellow-400 to-amber-500',
                  'from-purple-400 to-violet-500'
                ]
                
                return (
                  <div key={serviceItem.id} className="group transform hover:scale-105 transition-all duration-300">
                    <div className={`bg-gradient-to-br ${serviceColors[index % serviceColors.length]} rounded-3xl p-8 text-white shadow-xl`}>
                      <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
                          <Camera className="h-8 w-8 text-white" />
                        </div>
                        <h5 className="text-xl font-bold mb-2">🎯 Service #{serviceItem.id}</h5>
                        <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full">
                          ×{serviceItem.quantity} Magic Shots!
                        </Badge>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-bold">{formatCurrency(serviceItem.quantity * 5000)}</p>
                        <p className="text-white/80 text-sm mt-2">Creative Excellence Guaranteed! ✨</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fun Deliverables */}
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-4 border-emerald-200 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8">
            <h3 className="text-4xl font-bold text-white text-center">🎁 Your Treasure Box! 💎</h3>
          </div>
          <CardContent className="p-10">
            <div className="space-y-6">
              {quotationData.selected_deliverables.map((deliverableItem, index) => (
                <div key={deliverableItem.id} className={`bg-gradient-to-r from-emerald-100 to-teal-100 border-4 border-emerald-300 rounded-3xl p-8 transform ${index % 2 === 0 ? 'rotate-1' : '-rotate-1'} hover:rotate-0 transition-transform duration-300`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl">
                        <Package className="h-10 w-10 text-white" />
                      </div>
                      <div>
                        <h5 className="text-2xl font-bold text-emerald-900 mb-2">🎉 Deliverable #{deliverableItem.id}</h5>
                        <p className="text-emerald-700 text-lg">Quantity: {deliverableItem.quantity} pieces of awesome!</p>
                        <p className="text-emerald-800 text-sm mt-1">Handcrafted with love and creativity! 💖</p>
                        {showDeliverableTracking && (
                          <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white mt-2 px-4 py-2 rounded-full">
                            🎨 Waiting for the magic to begin!
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-emerald-900">{formatCurrency(deliverableItem.quantity * 8000)}</p>
                      <p className="text-emerald-700 text-sm">Pure Awesomeness!</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Colorful Terms */}
        <Card className="bg-white border-0 shadow-xl rounded-3xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-8">
            <h3 className="text-4xl font-bold text-white text-center">📋 The Fun Print! (Terms & Conditions) 📋</h3>
          </div>
          <CardContent className="p-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="text-center bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl p-8 border-4 border-green-300">
                <div className="text-6xl mb-4">💰</div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">Payment Party! 🎉</h4>
                <div className="text-gray-600 space-y-2 text-lg">
                  <p>• 50% to start the fun!</p>
                  <p>• Rest before we shoot!</p>
                  <p>• Easy payment options!</p>
                  <p>• No hidden surprises!</p>
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-blue-100 to-cyan-100 rounded-3xl p-8 border-4 border-blue-300">
                <div className="text-6xl mb-4">⚡</div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">Delivery Speed! 🚀</h4>
                <div className="text-gray-600 space-y-2 text-lg">
                  <p>• Sneak peeks: 3-5 days</p>
                  <p>• Full gallery: 15-20 days</p>
                  <p>• Video magic: 25-30 days</p>
                  <p>• Everything else: 45-60 days</p>
                </div>
              </div>
              <div className="text-center bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 border-4 border-purple-300">
                <div className="text-6xl mb-4">🎈</div>
                <h4 className="text-2xl font-bold text-gray-800 mb-4">Extra Notes! 📝</h4>
                <div className="text-gray-600 space-y-2 text-lg">
                  <p>• Valid for 30 fun days!</p>
                  <p>• Travel = adventure!</p>
                  <p>• Rain or shine, we shine!</p>
                  <p>• Backup plans ready!</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Energetic Contact */}
        <Card className="bg-gradient-to-r from-pink-500 via-purple-500 via-blue-500 to-green-500 border-0 shadow-2xl rounded-3xl overflow-hidden">
          <CardContent className="p-12 text-center text-white">
            <div className="mb-8">
              <div className="text-8xl mb-6">🚀</div>
              <h3 className="text-5xl font-bold mb-4">Ready to Create Magic? ✨</h3>
              <p className="text-2xl text-white/90 leading-relaxed max-w-4xl mx-auto">
                LET'S DO THIS! 🎉 We're bursting with excitement to capture your amazing story! 
                Hit us up and let's start planning the most epic photo adventure EVER! 📸💫
              </p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 text-xl">
                <Phone className="h-6 w-6" />
                <span>{companySettings?.contactInfo?.phone || "+91 98765 43210"}</span>
              </div>
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-full px-8 py-4 text-xl">
                <Mail className="h-6 w-6" />
                <span>{companySettings?.contactInfo?.email || "hello@creativelens.com"}</span>
              </div>
            </div>
            
            <div className="text-6xl space-x-4">
              <span>🌈</span>
              <span>📷</span>
              <span>💖</span>
              <span>✨</span>
              <span>🎨</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 