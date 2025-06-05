import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * 📊 Track Notification Engagement
 * POST /api/notifications/engagement
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      notification_id, 
      user_id, 
      event_type, 
      engagement_data = {},
      timestamp 
    } = body;

    // Validate required fields
    if (!notification_id || !user_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: notification_id, user_id, event_type' },
        { status: 400 }
      );
    }

    // Validate event type
    const validEventTypes = ['delivered', 'viewed', 'clicked', 'dismissed'];
    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Verify notification exists and belongs to user
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .select('id, user_id, type, created_at')
      .eq('id', notification_id)
      .eq('user_id', user_id)
      .single();

    if (notificationError || !notification) {
      return NextResponse.json(
        { error: 'Notification not found or access denied' },
        { status: 404 }
      );
    }

    // Check for duplicate engagement events (prevent spam)
    const { data: existingEvent } = await supabase
      .from('notification_engagement')
      .select('id')
      .eq('notification_id', notification_id)
      .eq('user_id', user_id)
      .eq('event_type', event_type)
      .single();

    if (existingEvent && event_type !== 'viewed') {
      // Allow multiple 'viewed' events but prevent duplicate other events
      return NextResponse.json(
        { error: 'Engagement event already recorded' },
        { status: 409 }
      );
    }

    // Calculate response time
    const notificationTime = new Date(notification.created_at).getTime();
    const engagementTime = timestamp ? new Date(timestamp).getTime() : Date.now();
    const responseTimeSeconds = Math.round((engagementTime - notificationTime) / 1000);

    // Record engagement
    const { data: engagement, error: engagementError } = await supabase
      .from('notification_engagement')
      .insert({
        notification_id,
        user_id,
        event_type,
        engagement_data: {
          ...engagement_data,
          response_time_seconds: responseTimeSeconds,
          notification_type: notification.type,
          user_agent: request.headers.get('user-agent') || 'unknown',
          client_timestamp: timestamp
        },
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (engagementError) {
      throw engagementError;
    }

    // Update notification read status if viewed or clicked
    if (event_type === 'viewed' || event_type === 'clicked') {
      await supabase
        .from('notifications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', notification_id);
    }

    // Update user behavior analytics counters
    if (event_type === 'delivered') {
      await supabase.rpc('increment_notification_received', { 
        target_user_id: user_id 
      });
    } else if (event_type === 'viewed' || event_type === 'clicked') {
      await supabase.rpc('increment_notification_read', { 
        target_user_id: user_id,
        response_time: responseTimeSeconds
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        engagement_id: engagement.id,
        event_type,
        response_time_seconds: responseTimeSeconds,
        ai_learning_enabled: true
      },
      meta: {
        timestamp: new Date().toISOString(),
        notification_type: notification.type
      }
    });

  } catch (error) {
    console.error('Engagement Tracking Error:', error);
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
 * 📈 Get Engagement Analytics
 * GET /api/notifications/engagement?user_id=xxx&timeframe=7d
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const timeframe = searchParams.get('timeframe') || '7d';
    const notificationType = searchParams.get('type');

    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    // Calculate date range
    const timeframeDays = {
      '1d': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    
    const days = timeframeDays[timeframe as keyof typeof timeframeDays] || 7;
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    // Build query
    let query = supabase
      .from('notification_engagement')
      .select(`
        *,
        notifications!inner(type, priority, created_at)
      `)
      .eq('user_id', userId)
      .gte('created_at', fromDate);

    if (notificationType) {
      query = query.eq('notifications.type', notificationType);
    }

    const { data: engagements, error } = await query;

    if (error) throw error;

    // Calculate analytics
    const analytics = {
      total_engagements: engagements.length,
      by_event_type: {} as Record<string, number>,
      by_notification_type: {} as Record<string, number>,
      avg_response_time: 0,
      engagement_rate: 0,
      trends: {
        daily_engagements: {} as Record<string, number>
      }
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;

    engagements.forEach(engagement => {
      // Count by event type
      analytics.by_event_type[engagement.event_type] = 
        (analytics.by_event_type[engagement.event_type] || 0) + 1;

      // Count by notification type
      const notificationType = engagement.notifications.type;
      analytics.by_notification_type[notificationType] = 
        (analytics.by_notification_type[notificationType] || 0) + 1;

      // Calculate response time
      if (engagement.engagement_data?.response_time_seconds) {
        totalResponseTime += engagement.engagement_data.response_time_seconds;
        responseTimeCount++;
      }

      // Daily trends
      const date = new Date(engagement.created_at).toISOString().split('T')[0];
      analytics.trends.daily_engagements[date] = 
        (analytics.trends.daily_engagements[date] || 0) + 1;
    });

    // Calculate averages
    analytics.avg_response_time = responseTimeCount > 0 ? 
      Math.round(totalResponseTime / responseTimeCount) : 0;

    // Get total notifications sent for engagement rate
    const { data: totalNotifications } = await supabase
      .from('notifications')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', fromDate);

    const totalSent = totalNotifications?.length || 0;
    const totalViewed = analytics.by_event_type.viewed || 0;
    analytics.engagement_rate = totalSent > 0 ? 
      Math.round((totalViewed / totalSent) * 100) : 0;

    // Get user behavior summary
    const { data: behaviorSummary } = await supabase
      .from('user_engagement_summary')
      .select('*')
      .eq('user_id', userId)
      .single();

    return NextResponse.json({
      success: true,
      data: analytics,
      user_profile: behaviorSummary,
      timeframe: {
        period: timeframe,
        from: fromDate,
        to: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Engagement Analytics Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
} 