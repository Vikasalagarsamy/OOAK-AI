import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AINotificationService } from '@/lib/ai-notification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const aiService = new AINotificationService();

/**
 * 🔮 Get Predictive Insights
 * GET /api/notifications/insights?user_id=xxx&type=all
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const insightType = searchParams.get('type') || 'all';
    const includeExpired = searchParams.get('include_expired') === 'true';

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    switch (insightType) {
      case 'predictive':
        // Generate new predictive insights
        const newInsights = await aiService.generatePredictiveNotifications(userId);
        
        // Store insights in database
        if (newInsights.length > 0) {
          await Promise.all(newInsights.map(insight => 
            supabase.from('predictive_insights').upsert({
              user_id: userId,
              insight_type: insight.event_type,
              probability: insight.probability,
              recommended_action: insight.recommended_action,
              trigger_conditions: insight.trigger_conditions,
              estimated_impact: insight.estimated_impact,
              status: 'pending',
              expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            }, { 
              onConflict: 'user_id,insight_type',
              ignoreDuplicates: false 
            })
          ));
        }

        return NextResponse.json({
          success: true,
          data: newInsights,
          count: newInsights.length,
          actionable_insights: newInsights.filter(i => i.probability > 0.7).length
        });

      case 'stored':
        // Get stored insights from database
        let query = supabase
          .from('ai_insights_summary')
          .select('*')
          .eq('user_id', userId);

        if (!includeExpired) {
          query = query.eq('is_expired', false);
        }

        const { data: storedInsights, error } = await query;
        if (error) throw error;

        return NextResponse.json({
          success: true,
          data: storedInsights,
          count: storedInsights.length,
          high_priority: storedInsights.filter(i => i.probability > 0.8).length
        });

      case 'performance':
        // Get notification performance insights
        const { data: perfData, error: perfError } = await supabase
          .from('notification_performance_metrics')
          .select('*');

        if (perfError) throw perfError;

        // Calculate insights from performance data
        const performanceInsights = perfData.map(metric => ({
          type: 'performance_insight',
          notification_type: metric.type,
          priority: metric.priority,
          view_rate: metric.view_rate,
          click_rate: metric.click_rate,
          recommendations: generatePerformanceRecommendations(metric),
          trend: calculateTrend(metric)
        }));

        return NextResponse.json({
          success: true,
          data: performanceInsights,
          summary: {
            avg_view_rate: perfData.reduce((sum, m) => sum + (m.view_rate || 0), 0) / perfData.length,
            avg_click_rate: perfData.reduce((sum, m) => sum + (m.click_rate || 0), 0) / perfData.length,
            best_performing_type: perfData.sort((a, b) => (b.view_rate || 0) - (a.view_rate || 0))[0]?.type
          }
        });

      case 'user_behavior':
        // Get user behavior insights
        const { data: userBehaviorData, error: behaviorError } = await supabase
          .from('user_engagement_summary')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (behaviorError) throw behaviorError;

        const behaviorInsights = {
          engagement_level: categorizeEngagement(userBehaviorData.engagement_score),
          read_rate_analysis: analyzeReadRate(userBehaviorData.read_rate),
          activity_pattern: analyzeMostActiveHours(userBehaviorData.most_active_hours),
          response_time_analysis: analyzeResponseTime(userBehaviorData.avg_response_time),
          recommendations: generateUserRecommendations(userBehaviorData)
        };

        return NextResponse.json({
          success: true,
          data: behaviorInsights,
          user_profile: userBehaviorData
        });

      case 'all':
      default:
        // Get comprehensive insights
        const [predictiveData, storedData, performanceResponse, behaviorResponse] = await Promise.all([
          aiService.generatePredictiveNotifications(userId),
          supabase.from('ai_insights_summary').select('*').eq('user_id', userId).eq('is_expired', false),
          supabase.from('notification_performance_metrics').select('*'),
          supabase.from('user_engagement_summary').select('*').eq('user_id', userId).single()
        ]);

        return NextResponse.json({
          success: true,
          data: {
            predictive: predictiveData,
            stored: storedData.data || [],
            performance: performanceResponse.data || [],
            behavior: behaviorResponse.data
          },
          summary: {
            total_insights: predictiveData.length + (storedData.data?.length || 0),
            high_priority_count: predictiveData.filter(i => i.probability > 0.8).length,
            user_engagement_level: categorizeEngagement(behaviorResponse.data?.engagement_score || 0.5)
          }
        });
    }

  } catch (error) {
    console.error('Insights API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * 📝 Update Insight Status
 * PUT /api/notifications/insights
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { insight_id, user_id, status, feedback } = body;

    if (!insight_id || !user_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields: insight_id, user_id, status' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'triggered', 'completed', 'expired', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update insight status
    const { data: updatedInsight, error } = await supabase
      .from('predictive_insights')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(feedback && { trigger_conditions: { ...feedback } })
      })
      .eq('id', insight_id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) throw error;

    // Log feedback for AI learning
    if (feedback) {
      await supabase.from('ai_decision_log').insert({
        decision_type: 'insight_feedback',
        decision_data: {
          insight_id,
          old_status: 'pending',
          new_status: status,
          user_feedback: feedback,
          timestamp: new Date().toISOString()
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedInsight,
      message: `Insight status updated to ${status}`
    });

  } catch (error) {
    console.error('Insight Update Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

/**
 * 🤖 Trigger Automated Insights
 * POST /api/notifications/insights
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action = 'generate_and_act' } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    switch (action) {
      case 'generate_and_act':
        // Generate insights and automatically create notifications for high-probability ones
        const insights = await aiService.generatePredictiveNotifications(user_id);
        const actedInsights = [];

        for (const insight of insights) {
          if (insight.probability > 0.8) {
            // Auto-create notification for high-probability insights
            try {
              const notificationResult = await aiService.createSmartNotification({
                user_id,
                type: 'ai_insight',
                title: getInsightTitle(insight),
                message: getInsightMessage(insight),
                priority: insight.probability > 0.9 ? 'high' : 'medium',
                metadata: {
                  insight_type: insight.event_type,
                  probability: insight.probability,
                  auto_generated: true
                },
                allow_ai_optimization: true
              });

              actedInsights.push({
                insight,
                notification_id: notificationResult.notification_id,
                action_taken: 'notification_created'
              });

              // Mark insight as triggered
              await supabase.from('predictive_insights').upsert({
                user_id,
                insight_type: insight.event_type,
                probability: insight.probability,
                recommended_action: insight.recommended_action,
                trigger_conditions: insight.trigger_conditions,
                estimated_impact: insight.estimated_impact,
                status: 'triggered'
              });

            } catch (error) {
              console.error('Failed to act on insight:', error);
            }
          }
        }

        return NextResponse.json({
          success: true,
          data: {
            total_insights: insights.length,
            acted_insights: actedInsights.length,
            actions: actedInsights
          },
          message: `Generated ${insights.length} insights, acted on ${actedInsights.length} high-probability ones`
        });

      case 'cleanup_expired':
        // Clean up expired insights
        await supabase.rpc('expire_old_insights');
        
        const { data: expiredCount } = await supabase
          .from('predictive_insights')
          .select('id', { count: 'exact' })
          .eq('status', 'expired');

        return NextResponse.json({
          success: true,
          data: { expired_insights_cleaned: expiredCount?.length || 0 }
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Insights Action Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

// Helper functions
function generatePerformanceRecommendations(metric: any) {
  const recommendations = [];
  
  if (metric.view_rate < 30) {
    recommendations.push('Consider improving notification timing or title copy');
  }
  if (metric.click_rate < 10) {
    recommendations.push('Review message content and call-to-action clarity');
  }
  if (metric.avg_response_time > 3600) {
    recommendations.push('Notifications may not be reaching users at optimal times');
  }
  
  return recommendations;
}

function calculateTrend(metric: any) {
  // Simplified trend calculation - in real implementation, compare with historical data
  if (metric.view_rate > 70) return 'improving';
  if (metric.view_rate < 30) return 'declining';
  return 'stable';
}

function categorizeEngagement(score: number) {
  if (score >= 0.8) return 'highly_engaged';
  if (score >= 0.6) return 'moderately_engaged';
  if (score >= 0.4) return 'low_engagement';
  return 'very_low_engagement';
}

function analyzeReadRate(rate: number) {
  if (rate >= 80) return 'excellent';
  if (rate >= 60) return 'good';
  if (rate >= 40) return 'average';
  return 'needs_improvement';
}

function analyzeMostActiveHours(hours: number[]) {
  if (!hours || hours.length === 0) return 'no_pattern';
  
  const businessHours = hours.filter(h => h >= 9 && h <= 17).length;
  const eveningHours = hours.filter(h => h >= 18 && h <= 22).length;
  
  if (businessHours > eveningHours) return 'business_hours_active';
  if (eveningHours > businessHours) return 'evening_active';
  return 'mixed_pattern';
}

function analyzeResponseTime(avgTime: number) {
  if (avgTime < 300) return 'very_responsive';
  if (avgTime < 1800) return 'responsive';
  if (avgTime < 3600) return 'moderate';
  return 'slow_response';
}

function generateUserRecommendations(behaviorData: any) {
  const recommendations = [];
  
  if (behaviorData.engagement_score < 0.5) {
    recommendations.push('Consider reducing notification frequency');
  }
  if (behaviorData.read_rate < 50) {
    recommendations.push('Improve notification relevance and timing');
  }
  if (behaviorData.avg_response_time > 3600) {
    recommendations.push('Send notifications during user\'s active hours');
  }
  
  return recommendations;
}

function getInsightTitle(insight: any) {
  const titles = {
    user_inactivity_risk: '👋 We miss you!',
    upsell_opportunity: '🚀 Unlock new features',
    support_need_predicted: '💡 Need help?'
  };
  return titles[insight.event_type as keyof typeof titles] || '📢 Important update';
}

function getInsightMessage(insight: any) {
  const messages = {
    user_inactivity_risk: 'It looks like you haven\'t been active lately. Check out what\'s new!',
    upsell_opportunity: 'Based on your usage, you might benefit from our premium features.',
    support_need_predicted: 'We noticed you might need assistance. Our support team is here to help!'
  };
  return messages[insight.event_type as keyof typeof messages] || insight.recommended_action;
}