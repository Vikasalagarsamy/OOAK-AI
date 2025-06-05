import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AINotificationService, type SmartNotificationRequest } from '@/lib/ai-notification-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const aiService = new AINotificationService();

// Rate limiting storage (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * 🧠 Smart Notification Creation
 * POST /api/notifications/ai
 */
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Get user from auth
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limiting check
    const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
    const rateLimitKey = `ai-notifications:${clientIP}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 20; // 20 AI requests per minute

    const rateLimit = rateLimitStore.get(rateLimitKey) || { count: 0, resetTime: now + windowMs };
    
    if (now > rateLimit.resetTime) {
      rateLimit.count = 0;
      rateLimit.resetTime = now + windowMs;
    }
    
    if (rateLimit.count >= maxRequests) {
      return NextResponse.json(
        { error: 'Rate limit exceeded for AI notifications' }, 
        { status: 429 }
      );
    }
    
    rateLimit.count++;
    rateLimitStore.set(rateLimitKey, rateLimit);

    // Parse request body
    const body = await request.json();
    const {
      user_id,
      type,
      title,
      message,
      priority = 'medium',
      metadata = {},
      allow_ai_optimization = true,
      target_engagement_rate
    } = body as SmartNotificationRequest;

    // Validate required fields
    if (!user_id || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, title, message' }, 
        { status: 400 }
      );
    }

    // Validate user exists
    const { data: user, error: userError } = await supabase.auth.admin.getUserById(user_id);
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Create smart notification with AI enhancements
    const result = await aiService.createSmartNotification({
      user_id,
      type,
      title,
      message,
      priority,
      metadata: {
        ...metadata,
        api_created: true,
        client_ip: clientIP,
        user_agent: request.headers.get('user-agent') || 'unknown'
      },
      allow_ai_optimization,
      target_engagement_rate
    });

    const executionTime = Date.now() - startTime;

    // Log API usage for analytics
    await supabase.from('user_activity_history').insert({
      user_id,
      activity_type: 'ai_notification_created',
      activity_data: {
        notification_id: result.notification_id,
        ai_enhanced: result.personalization_applied,
        execution_time: executionTime,
        endpoint: '/api/notifications/ai'
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        notification_id: result.notification_id,
        scheduled_time: result.scheduled_time,
        ai_enhanced: result.personalization_applied,
        ai_insights: result.ai_enhancements,
        execution_time: executionTime
      },
      meta: {
        version: 'v1.0',
        ai_powered: true,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI Notification API Error:', error);
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
 * 🎯 Get Optimal Timing for Notification
 * GET /api/notifications/ai?action=timing&user_id=xxx&type=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const userId = searchParams.get('user_id');
    const notificationType = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    switch (action) {
      case 'timing':
        if (!notificationType) {
          return NextResponse.json({ error: 'type is required for timing optimization' }, { status: 400 });
        }
        
        const timingResult = await aiService.calculateOptimalTiming(userId, notificationType);
        
        return NextResponse.json({
          success: true,
          data: timingResult,
          recommendations: {
            best_time: timingResult.optimal_time,
            confidence_level: timingResult.confidence_score > 0.8 ? 'high' : 
                            timingResult.confidence_score > 0.6 ? 'medium' : 'low',
            reasoning: timingResult.reasoning
          }
        });

      case 'insights':
        const insights = await aiService.generatePredictiveNotifications(userId);
        
        return NextResponse.json({
          success: true,
          data: insights,
          count: insights.length,
          high_probability_insights: insights.filter(i => i.probability > 0.8).length
        });

      case 'behavior':
        const { data: behaviorData } = await supabase
          .from('user_behavior_analytics')
          .select('*')
          .eq('user_id', userId)
          .single();

        const { data: engagementData } = await supabase
          .from('user_engagement_summary')
          .select('*')
          .eq('user_id', userId)
          .single();

        return NextResponse.json({
          success: true,
          data: {
            behavior: behaviorData,
            engagement: engagementData,
            ai_profile: {
              personalization_ready: behaviorData?.engagement_score > 0.3,
              timing_data_available: behaviorData?.most_active_hours?.length > 3,
              predicted_engagement: behaviorData?.engagement_score || 0.5
            }
          }
        });

      default:
        return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('AI GET API Error:', error);
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
 * 🔄 Update AI Preferences and Behavior
 * PUT /api/notifications/ai
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, data } = body;

    if (!user_id || !action) {
      return NextResponse.json({ error: 'user_id and action are required' }, { status: 400 });
    }

    switch (action) {
      case 'preferences':
        const { error: prefError } = await supabase
          .from('user_preferences')
          .upsert({
            user_id,
            ...data,
            updated_at: new Date().toISOString()
          });

        if (prefError) throw prefError;

        return NextResponse.json({
          success: true,
          message: 'User preferences updated successfully'
        });

      case 'engagement':
        // Manual engagement score update
        const { error: engagementError } = await supabase
          .from('user_behavior_analytics')
          .upsert({
            user_id,
            engagement_score: data.engagement_score,
            updated_at: new Date().toISOString()
          });

        if (engagementError) throw engagementError;

        return NextResponse.json({
          success: true,
          message: 'Engagement score updated successfully'
        });

      case 'activity':
        // Log user activity for AI learning
        const { error: activityError } = await supabase
          .from('user_activity_history')
          .insert({
            user_id,
            activity_type: data.activity_type,
            activity_data: data.activity_data || {}
          });

        if (activityError) throw activityError;

        return NextResponse.json({
          success: true,
          message: 'Activity logged successfully'
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('AI PUT API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 