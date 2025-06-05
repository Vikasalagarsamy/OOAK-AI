"use client"

import { useState, useEffect } from "react"
import { getCurrentUser } from "@/actions/auth-actions"
import { getPersonalMetrics } from "@/services/personal-metrics-service"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { TrendingUp, Target, Clock, Star, Trophy, Zap, ArrowRight, Calendar } from "lucide-react"

// Collection of motivational quotes
const motivationalQuotes = [
  "Think it. Say it. OOAK it.",
  "Dream it. Plan it. Execute it.",
  "Believe it. Achieve it. Live it.",
  "Create it. Share it. Impact it.",
  "Vision it. Build it. Scale it.",
  "Imagine it. Design it. Deliver it.",
  "Focus it. Perfect it. Launch it.",
  "Start it. Finish it. Master it.",
  "Learn it. Apply it. Teach it.",
  "Feel it. Express it. Inspire it."
]

interface User {
  firstName?: string
  lastName?: string
  username: string
  roleName?: string
  isAdmin?: boolean
}

interface PersonalMetrics {
  leadsThisMonth: number
  conversionRate: number
  productivity: number
  rank: number
  totalUsers: number
  streak: number
  bestPerformanceDay: string
  suggestions: string[]
}

// Default/mock metrics to show immediately
const DEFAULT_METRICS: PersonalMetrics = {
  leadsThisMonth: 12,
  conversionRate: 68.5,
  productivity: 85,
  rank: 2,
  totalUsers: 15,
  streak: 5,
  bestPerformanceDay: "Tuesday",
  suggestions: [
    "Follow up with pending leads",
    "Review pending quotations",
    "Schedule team check-in",
    "Update client information"
  ]
}

export function PersonalizedHeader() {
  const [user, setUser] = useState<User | null>(null)
  const [currentQuote, setCurrentQuote] = useState("")
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<PersonalMetrics>(DEFAULT_METRICS)
  const [userLoaded, setUserLoaded] = useState(false)
  const [metricsLoaded, setMetricsLoaded] = useState(false)

  useEffect(() => {
    // Set random quote immediately
    const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
    setCurrentQuote(randomQuote)

    // Load user data and metrics concurrently with timeout
    const loadData = async () => {
      try {
        // Start both requests concurrently
        const userPromise = getCurrentUser()
        const metricsPromise = Promise.race([
          getPersonalMetrics(),
          new Promise<PersonalMetrics>((resolve) => 
            setTimeout(() => resolve(DEFAULT_METRICS), 3000) // 3 second timeout
          )
        ])

        // Load user first (usually faster)
        try {
          const userData = await userPromise
          setUser(userData)
          setUserLoaded(true)
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserLoaded(true)
        }

        // Load metrics (with timeout fallback)
        try {
          const personalMetrics = await metricsPromise
          setMetrics(personalMetrics)
          setMetricsLoaded(true)
        } catch (error) {
          console.error("Error fetching metrics:", error)
          setMetrics(DEFAULT_METRICS)
          setMetricsLoaded(true)
        }

      } catch (error) {
        console.error("Error in loadData:", error)
        setMetrics(DEFAULT_METRICS)
        setUserLoaded(true)
        setMetricsLoaded(true)
      } finally {
        setLoading(false)
      }
    }

    loadData()
    
    // Change quote every 45 seconds (reduced frequency)
    const interval = setInterval(() => {
      const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)]
      setCurrentQuote(randomQuote)
    }, 45000)

    return () => clearInterval(interval)
  }, [])

  // Smart time-based greetings
  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours()
    const name = getDisplayName()
    
    if (hour >= 5 && hour < 12) {
      return { greeting: "Good morning", name }
    } else if (hour >= 12 && hour < 17) {
      return { greeting: "Good afternoon", name }
    } else if (hour >= 17 && hour < 22) {
      return { greeting: "Good evening", name }
    } else {
      return { greeting: "Working late", name }
    }
  }

  // Contextual sub-messages
  const getContextualMessage = () => {
    const day = new Date().getDay()
    const hour = new Date().getHours()
    
    if (day === 1 && hour < 12) return "Let's make this Monday productive!"
    if (day === 3) return "Halfway through the week - keep pushing!"
    if (day === 5 && hour > 14) return "Friday energy - almost there! 🎯"
    if (day === 0 || day === 6) return "Weekend warrior mode activated!"
    if (hour < 9) return "Early bird catches the worm! 🐦"
    if (hour > 18) return "Dedication level: Maximum! 💪"
    
    return "Ready to make today extraordinary?"
  }

  // Get user's first name or username
  const getDisplayName = () => {
    if (user?.firstName) {
      return user.firstName
    }
    if (user?.username) {
      // Extract first name from username if it contains dots or underscores
      const parts = user.username.split(/[._]/)
      return parts[0].charAt(0).toUpperCase() + parts[0].slice(1)
    }
    return "Friend"
  }

  // Parse quote to apply styling
  const parseQuote = (quote: string) => {
    const words = quote.split(' ')
    return (
      <>
        {words.map((word, index) => {
          const isLastWord = index === words.length - 1
          const isSecondToLast = index === words.length - 2
          
          let className = ""
          if (word.includes('OOAK')) {
            className = "font-normal italic text-primary"
          } else if (isLastWord && word.endsWith('.')) {
            className = "font-normal italic text-primary"
          } else if (isSecondToLast || word.includes('it.')) {
            className = "font-semibold text-foreground"
          } else {
            className = "font-normal text-foreground"
          }

          return (
            <span key={index}>
              {index > 0 && " "}
              <span className={className}>{word}</span>
            </span>
          )
        })}
      </>
    )
  }

  // Show immediate loading state only briefly
  if (loading && !userLoaded) {
    return (
      <div className="mb-12 text-center">
        <div className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg mb-4 max-w-md mx-auto"></div>
        <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-300 animate-pulse rounded-lg max-w-lg mx-auto"></div>
      </div>
    )
  }

  const { greeting, name } = getTimeBasedGreeting()

  return (
    <div className="mb-12 text-center space-y-8">
      {/* Personalized Greeting with Curvy Name */}
      <div className="space-y-3">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-light text-foreground tracking-tight">
          <span className="font-medium">
            {greeting}, 
          </span>
          <span 
            className="font-bold text-black ml-3 relative inline-block"
            style={{
              transform: 'rotate(-0.5deg) scale(1.02)',
              filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
              fontFamily: 'var(--font-dancing-script), "Dancing Script", "Brush Script MT", cursive',
              letterSpacing: '0.01em'
            }}
          >
            {name}
          </span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-light">
          {getContextualMessage()}
        </p>
        
        {/* Admin Badge */}
        {user?.isAdmin && (
          <Badge variant="outline" className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:from-purple-200 hover:to-pink-200 transition-all duration-300">
            <Star className="w-3 h-3 mr-1" />
            Administrator
          </Badge>
        )}
      </div>

      {/* Personal Metrics Dashboard with Hover Effects */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        {/* Productivity Insights */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 border-green-200 hover:border-green-300 hover:shadow-lg hover:shadow-green-100/50 transition-all duration-300 hover:scale-105 group cursor-pointer">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-600 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold text-green-800">Productivity</span>
              </div>
              <div className="text-2xl font-bold text-green-700 group-hover:text-green-800 transition-colors duration-300">
                {metricsLoaded ? `${metrics.productivity}%` : <div className="w-12 h-6 bg-green-200 animate-pulse rounded mx-auto"></div>}
              </div>
              <p className="text-xs text-green-600 mt-1">
                Best on {metrics.bestPerformanceDay}s • {metrics.streak} day streak!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Personal Leaderboard */}
        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 border-orange-200 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 hover:scale-105 group cursor-pointer">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="w-5 h-5 text-orange-600 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold text-orange-800">Team Rank</span>
              </div>
              <div className="text-2xl font-bold text-orange-700 group-hover:text-orange-800 transition-colors duration-300">
                {metricsLoaded ? `#${metrics.rank}` : <div className="w-8 h-6 bg-orange-200 animate-pulse rounded mx-auto"></div>}
              </div>
              <p className="text-xs text-orange-600 mt-1">
                of {metrics.totalUsers} users • {metrics.conversionRate}% conversion rate
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Current Month Progress */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 border-blue-200 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-100/50 transition-all duration-300 hover:scale-105 group cursor-pointer">
          <CardContent className="p-4 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-center mb-2">
                <Target className="w-5 h-5 text-blue-600 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <span className="font-semibold text-blue-800">This Month</span>
              </div>
              <div className="text-2xl font-bold text-blue-700 group-hover:text-blue-800 transition-colors duration-300">
                {metricsLoaded ? metrics.leadsThisMonth : <div className="w-6 h-6 bg-blue-200 animate-pulse rounded mx-auto"></div>}
              </div>
              <p className="text-xs text-blue-600 mt-1">
                leads closed • 3 more to hit target! 🎯
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Powered Suggestions with Enhanced Hover Effects */}
      {metricsLoaded && (
        <Card className="max-w-4xl mx-auto bg-gradient-to-r from-violet-50 to-purple-100 border-violet-200 hover:border-violet-300 hover:shadow-xl hover:shadow-violet-100/50 transition-all duration-300 group">
          <CardContent className="p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-400/5 to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="flex items-center mb-4">
                <Zap className="w-5 h-5 text-violet-600 mr-2 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="font-semibold text-violet-800">Smart Suggestions for You</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {metrics.suggestions.slice(0, 4).map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="justify-start h-auto p-3 text-left bg-white/50 hover:bg-white/90 text-violet-700 hover:text-violet-800 border border-white/20 hover:border-violet-200 hover:shadow-md transition-all duration-300 hover:scale-102 group/suggestion"
                  >
                    <ArrowRight className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5 group-hover/suggestion:translate-x-1 transition-transform duration-300" />
                    <span className="text-sm">{suggestion}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Motivational Quote with Enhanced Styling */}
      <div className="max-w-4xl mx-auto">
        <div 
          className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl leading-tight md:leading-tight lg:leading-tight xl:leading-tight transition-all duration-1000 ease-in-out hover:scale-105 cursor-default"
          style={{ 
            fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
            letterSpacing: "-0.02em"
          }}
        >
          {parseQuote(currentQuote)}
        </div>
        
        {/* Enhanced animation indicator */}
        <div className="mt-6 flex justify-center">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gradient-to-r from-primary/30 to-primary/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-gradient-to-r from-primary/50 to-primary/80 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-gradient-to-r from-primary/70 to-primary rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      </div>

      {/* Subtle divider with gradient */}
      <div className="pt-8">
        <div className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto"></div>
      </div>
    </div>
  )
} 