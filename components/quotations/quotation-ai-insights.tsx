"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Brain, 
  Target, 
  Lightbulb, 
  TrendingUp, 
  AlertTriangle,
  Zap,
  CheckCircle,
  Clock
} from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface QuotationAIInsightsProps {
  quotationId: number
  quotationData: any
}

export function QuotationAIInsights({ quotationId, quotationData }: QuotationAIInsightsProps) {
  const [insights, setInsights] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const generateInsights = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/ai-insights/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quotation_id: quotationId })
      })

      if (response.ok) {
        const data = await response.json()
        setInsights(data)
        toast({
          title: "🧠 AI Analysis Complete",
          description: "Intelligent insights generated for this quotation",
        })
      } else {
        throw new Error('Failed to generate insights')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI insights",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return 'text-green-600'
    if (probability >= 0.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getProbabilityBg = (probability: number) => {
    if (probability >= 0.7) return 'bg-green-50 border-green-200'
    if (probability >= 0.5) return 'bg-yellow-50 border-yellow-200'
    return 'bg-red-50 border-red-200'
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <Clock className="h-4 w-4 text-orange-600" />
      case 'medium': return <Target className="h-4 w-4 text-yellow-600" />
      default: return <CheckCircle className="h-4 w-4 text-green-600" />
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          AI Insights
        </CardTitle>
        <CardDescription>
          Machine learning predictions and recommendations for this quotation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!insights ? (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              Generate AI-powered insights to see success predictions and smart recommendations
            </p>
            <Button onClick={generateInsights} disabled={isLoading}>
              <Zap className="h-4 w-4 mr-2" />
              {isLoading ? 'Analyzing...' : 'Generate AI Insights'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Success Prediction */}
            {insights.prediction && (
              <div className={`p-4 rounded-lg border ${getProbabilityBg(insights.prediction.probability)}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold">Success Prediction</h3>
                  </div>
                  <div className={`text-2xl font-bold ${getProbabilityColor(insights.prediction.probability)}`}>
                    {Math.round(insights.prediction.probability * 100)}%
                  </div>
                </div>
                <Progress 
                  value={insights.prediction.probability * 100} 
                  className="mb-3"
                />
                <div className="text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>AI Confidence:</span>
                    <span className="font-medium">
                      {Math.round(insights.prediction.confidence * 100)}%
                    </span>
                  </div>
                </div>
                
                {/* Prediction Factors */}
                {insights.prediction.prediction_factors && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Key Factors:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between">
                        <span>Quote Amount:</span>
                        <span>₹{insights.prediction.prediction_factors.quote_amount?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Days Since Created:</span>
                        <span>{insights.prediction.prediction_factors.days_since_created} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Package Type:</span>
                        <span className="capitalize">{insights.prediction.prediction_factors.package_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seasonal Factor:</span>
                        <span>{(insights.prediction.prediction_factors.seasonal_factor * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations */}
            {insights.recommendations && insights.recommendations.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-600" />
                  AI Recommendations ({insights.recommendations.length})
                </h3>
                <div className="space-y-3">
                  {insights.recommendations.map((rec: any, index: number) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getPriorityIcon(rec.priority)}
                          <span className="font-medium text-sm">{rec.title}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.priority}
                          </Badge>
                        </div>
                        <div className="text-xs text-green-600 font-medium">
                          {Math.round(rec.confidence_score * 100)}% confidence
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {rec.description}
                      </p>
                      <div className="text-xs">
                        <div className="font-medium text-blue-900 mb-1">
                          💡 {rec.suggested_action}
                        </div>
                        <div className="text-muted-foreground">
                          {rec.reasoning}
                        </div>
                        {rec.expected_impact && (
                          <div className="mt-2 flex gap-4 text-green-700">
                            {rec.expected_impact.conversion_boost && (
                              <span>+{Math.round(rec.expected_impact.conversion_boost * 100)}% conversion</span>
                            )}
                            {rec.expected_impact.timeline_reduction && (
                              <span>-{rec.expected_impact.timeline_reduction} days</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Client Insights */}
            {insights.client_insights && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Client Profile Analysis
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Sentiment Score:</span>
                    <div className={`font-medium ${insights.client_insights.sentiment_score > 0.5 ? 'text-green-600' : 'text-red-600'}`}>
                      {(insights.client_insights.sentiment_score * 100).toFixed(1)}% Positive
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Engagement Level:</span>
                    <div className="font-medium capitalize">{insights.client_insights.engagement_level}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Price Sensitivity:</span>
                    <div className="font-medium capitalize">{insights.client_insights.price_sensitivity}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Decision Timeline:</span>
                    <div className="font-medium">{insights.client_insights.decision_timeline_days} days</div>
                  </div>
                </div>
              </div>
            )}

            {/* Refresh Button */}
            <div className="text-center pt-4">
              <Button variant="outline" onClick={generateInsights} disabled={isLoading}>
                <Brain className="h-4 w-4 mr-2" />
                Refresh Analysis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 