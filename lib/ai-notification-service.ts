import { query } from '@/lib/postgresql-client';
import { getUserIdForDatabase } from '@/lib/uuid-helpers';

interface UserBehaviorData {
  user_id: string;
  most_active_hours: number[];
  avg_response_time: number;
  preferred_notification_types: string[];
  engagement_score: number;
  timezone: string;
  device_types: string[];
  last_activity: Date;
}

interface NotificationPattern {
  type: string;
  frequency: number;
  engagement_rate: number;
  optimal_timing: number[];
  user_segments: string[];
}

interface PredictiveInsight {
  event_type: string;
  probability: number;
  recommended_action: string;
  trigger_conditions: Record<string, any>;
  estimated_impact: number;
}

interface SmartNotificationRequest {
  user_id: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  allow_ai_optimization?: boolean;
  target_engagement_rate?: number;
}

class AINotificationService {
  /**
   * 🧠 Smart Timing Engine
   * Determines optimal delivery time based on user behavior patterns
   */
  async calculateOptimalTiming(userId: string, notificationType: string): Promise<{
    optimal_time: Date;
    confidence_score: number;
    reasoning: string;
  }> {
    const userBehavior = await this.getUserBehaviorData(userId);
    const typePatterns = await this.getNotificationPatterns(notificationType);
    
    // Get user's timezone and current time
    const userTimezone = userBehavior.timezone || 'UTC';
    const now = new Date();
    
    // Calculate optimal hour based on user's most active times
    const optimalHour = this.findOptimalHour(
      userBehavior.most_active_hours,
      typePatterns.optimal_timing
    );
    
    // Account for user's response patterns
    const responseTimeAdjustment = this.calculateResponseTimeAdjustment(
      userBehavior.avg_response_time
    );
    
    // Calculate next optimal delivery time
    const optimalTime = this.getNextOptimalTime(
      now,
      optimalHour,
      userTimezone,
      responseTimeAdjustment
    );
    
    // Calculate confidence based on data quality
    const confidence = this.calculateConfidence(userBehavior, typePatterns);
    
    const reasoning = this.generateTimingReasoning(
      userBehavior,
      typePatterns,
      optimalHour,
      confidence
    );
    
    return {
      optimal_time: optimalTime,
      confidence_score: confidence,
      reasoning
    };
  }

  /**
   * 🎯 Personalization Engine
   * Creates personalized notification content and delivery preferences
   */
  async personalizeNotification(
    userId: string,
    notification: SmartNotificationRequest
  ): Promise<{
    personalized_title: string;
    personalized_message: string;
    delivery_channel: string[];
    urgency_level: number;
    estimated_engagement: number;
  }> {
    const userBehavior = await this.getUserBehaviorData(userId);
    const userPreferences = await this.getUserPreferences(userId);
    
    // Personalize title based on user engagement patterns
    const personalizedTitle = await this.personalizeTitle(
      notification.title,
      userBehavior,
      notification.type
    );
    
    // Personalize message content
    const personalizedMessage = await this.personalizeMessage(
      notification.message,
      userBehavior,
      userPreferences
    );
    
    // Determine optimal delivery channels
    const deliveryChannels = this.selectOptimalChannels(
      userBehavior.device_types,
      userPreferences.channel_preferences,
      notification.priority
    );
    
    // Calculate urgency level (1-10)
    const urgencyLevel = this.calculateUrgencyLevel(
      notification.priority,
      userBehavior.engagement_score,
      notification.type
    );
    
    // Estimate engagement probability
    const estimatedEngagement = await this.predictEngagement(
      userId,
      notification.type,
      personalizedTitle,
      personalizedMessage
    );
    
    return {
      personalized_title: personalizedTitle,
      personalized_message: personalizedMessage,
      delivery_channel: deliveryChannels,
      urgency_level: urgencyLevel,
      estimated_engagement: estimatedEngagement
    };
  }

  /**
   * 🔮 Predictive Notification Engine
   * Generates proactive notifications based on user behavior patterns
   */
  async generatePredictiveNotifications(userId: string): Promise<PredictiveInsight[]> {
    const userBehavior = await this.getUserBehaviorData(userId);
    const historicalData = await this.getUserHistoricalData(userId);
    const insights: PredictiveInsight[] = [];
    
    // Predict user inactivity
    const inactivityPrediction = await this.predictUserInactivity(
      userBehavior,
      historicalData
    );
    if (inactivityPrediction.probability > 0.7) {
      insights.push({
        event_type: 'user_inactivity_risk',
        probability: inactivityPrediction.probability,
        recommended_action: 'Send re-engagement notification',
        trigger_conditions: { days_inactive: 3 },
        estimated_impact: 0.8
      });
    }
    
    // Predict optimal upsell timing
    const upsellPrediction = await this.predictUpsellOpportunity(
      userBehavior,
      historicalData
    );
    if (upsellPrediction.probability > 0.6) {
      insights.push({
        event_type: 'upsell_opportunity',
        probability: upsellPrediction.probability,
        recommended_action: 'Send feature upgrade notification',
        trigger_conditions: { feature_usage_increase: 0.5 },
        estimated_impact: upsellPrediction.estimated_revenue
      });
    }
    
    // Predict support needs
    const supportPrediction = await this.predictSupportNeeds(
      userBehavior,
      historicalData
    );
    if (supportPrediction.probability > 0.8) {
      insights.push({
        event_type: 'support_need_predicted',
        probability: supportPrediction.probability,
        recommended_action: 'Send proactive help notification',
        trigger_conditions: { error_rate_increase: 0.3 },
        estimated_impact: 0.9
      });
    }
    
    return insights;
  }

  /**
   * 🤝 Intelligent Grouping Engine
   * Groups related notifications to reduce noise and improve UX
   */
  async intelligentGrouping(
    userId: string,
    pendingNotifications: any[]
  ): Promise<{
    grouped_notifications: any[][];
    grouping_strategy: string;
    estimated_reduction: number;
  }> {
    // Analyze notification relationships
    const relationships = await this.analyzeNotificationRelationships(
      pendingNotifications
    );
    
    // Group by similarity and timing
    const groups = this.groupBySimilarity(pendingNotifications, relationships);
    
    // Apply business logic grouping
    const businessGroups = this.applyBusinessGrouping(groups, userId);
    
    // Calculate noise reduction
    const originalCount = pendingNotifications.length;
    const groupedCount = businessGroups.length;
    const reduction = (originalCount - groupedCount) / originalCount;
    
    return {
      grouped_notifications: businessGroups,
      grouping_strategy: this.determineGroupingStrategy(businessGroups),
      estimated_reduction: reduction
    };
  }

  /**
   * 📊 Smart Notification Creation with AI Enhancement
   */
  async createSmartNotification(request: SmartNotificationRequest): Promise<{
    notification_id: string;
    scheduled_time: Date;
    personalization_applied: boolean;
    ai_enhancements: Record<string, any>;
  }> {
    if (!request.allow_ai_optimization) {
      // Fallback to basic notification creation
      return this.createBasicNotification(request);
    }
    
    // Apply AI enhancements
    const timing = await this.calculateOptimalTiming(request.user_id, request.type);
    const personalization = await this.personalizeNotification(request.user_id, request);
    
    // Check for grouping opportunities
    const pendingNotifications = await this.getPendingNotifications(request.user_id);
    const grouping = await this.intelligentGrouping(request.user_id, pendingNotifications);
    
    // Create enhanced notification with PostgreSQL
    console.log(`🤖 Creating AI-enhanced notification for user ${request.user_id}`)
    
    const result = await query(`
      INSERT INTO notifications (
        user_id, type, title, message, priority, scheduled_for, metadata, is_read, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `, [
      parseInt(request.user_id.toString()), // Use integer for notifications table
      request.type,
      personalization.personalized_title,
      personalization.personalized_message,
      request.priority,
      timing.optimal_time,
      JSON.stringify({
        ...request.metadata,
        ai_enhanced: true,
        timing_confidence: timing.confidence_score,
        timing_reasoning: timing.reasoning,
        personalization_score: personalization.estimated_engagement,
        delivery_channels: personalization.delivery_channel,
        urgency_level: personalization.urgency_level
      }),
      false,
      new Date().toISOString()
    ])
    
    const notification = result.rows[0]
    
    // Log AI decision for learning
    await this.logAIDecision(notification.id, {
      timing_prediction: timing,
      personalization_applied: personalization,
      grouping_analysis: grouping
    });
    
    console.log(`✅ AI-enhanced notification created: ${notification.id}`)
    
    return {
      notification_id: notification.id,
      scheduled_time: timing.optimal_time,
      personalization_applied: true,
      ai_enhancements: {
        timing_optimization: timing,
        personalization: personalization,
        intelligent_grouping: grouping.estimated_reduction > 0
      }
    };
  }

  // Private helper methods
  private async getUserBehaviorData(userId: string): Promise<UserBehaviorData> {
    try {
      const result = await query(`
        SELECT * FROM user_behavior_analytics 
        WHERE user_id = $1
      `, [getUserIdForDatabase(userId)])
      
      const data = result.rows[0]
      return data || this.getDefaultBehaviorData(userId);
    } catch (error) {
      console.error('❌ Error fetching user behavior data:', error)
      return this.getDefaultBehaviorData(userId);
    }
  }

  private async getNotificationPatterns(type: string): Promise<NotificationPattern> {
    try {
      const result = await query(`
        SELECT * FROM notification_patterns 
        WHERE type = $1
      `, [type])
      
      const data = result.rows[0]
      return data || this.getDefaultPattern(type);
    } catch (error) {
      console.error('❌ Error fetching notification patterns:', error)
      return this.getDefaultPattern(type);
    }
  }

  private findOptimalHour(userHours: number[], typeHours: number[]): number {
    // Find intersection of user active hours and type optimal hours
    const intersection = userHours.filter(hour => typeHours.includes(hour));
    if (intersection.length > 0) {
      return intersection[0]; // Return first match
    }
    return userHours[0] || 9; // Default to 9 AM
  }

  private calculateResponseTimeAdjustment(avgResponseTime: number): number {
    // Adjust timing based on how quickly user typically responds
    if (avgResponseTime < 300) return -1; // Send 1 hour earlier for quick responders
    if (avgResponseTime > 3600) return 2; // Send 2 hours later for slow responders
    return 0;
  }

  private getNextOptimalTime(
    now: Date,
    optimalHour: number,
    timezone: string,
    adjustment: number
  ): Date {
    const targetTime = new Date(now);
    targetTime.setHours(optimalHour + adjustment, 0, 0, 0);
    
    // If time has passed today, schedule for tomorrow
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    return targetTime;
  }

  private calculateConfidence(
    userBehavior: UserBehaviorData,
    patterns: NotificationPattern
  ): number {
    // Base confidence on data quality and pattern strength
    let confidence = 0.5;
    
    if (userBehavior.most_active_hours.length > 3) confidence += 0.2;
    if (userBehavior.engagement_score > 0.7) confidence += 0.2;
    if (patterns.engagement_rate > 0.6) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  private generateTimingReasoning(
    userBehavior: UserBehaviorData,
    patterns: NotificationPattern,
    optimalHour: number,
    confidence: number
  ): string {
    return `Scheduled for ${optimalHour}:00 based on user's peak activity hours (${userBehavior.most_active_hours.join(', ')}) and ${patterns.type} notification patterns. Confidence: ${Math.round(confidence * 100)}%`;
  }

  private async personalizeTitle(
    originalTitle: string,
    userBehavior: UserBehaviorData,
    type: string
  ): Promise<string> {
    // Simple personalization - in real implementation, use AI/ML
    if (userBehavior.engagement_score > 0.8) {
      return `🌟 ${originalTitle}`;
    }
    if (type === 'business_update') {
      return `📊 ${originalTitle}`;
    }
    return originalTitle;
  }

  private async personalizeMessage(
    originalMessage: string,
    userBehavior: UserBehaviorData,
    preferences: any
  ): Promise<string> {
    // Add personalization based on user preferences
    let message = originalMessage;
    
    if (preferences?.include_name && preferences.name) {
      message = `Hi ${preferences.name}! ${message}`;
    }
    
    return message;
  }

  private selectOptimalChannels(
    deviceTypes: string[],
    channelPreferences: any,
    priority: string
  ): string[] {
    const channels = ['in_app'];
    
    if (priority === 'critical') {
      channels.push('email', 'push');
    } else if (priority === 'high') {
      channels.push('push');
    }
    
    return channels;
  }

  private calculateUrgencyLevel(
    priority: string,
    engagementScore: number,
    type: string
  ): number {
    const baseUrgency = {
      low: 2,
      medium: 5,
      high: 7,
      critical: 9
    };
    
    let urgency = baseUrgency[priority as keyof typeof baseUrgency] || 5;
    
    // Adjust based on engagement
    if (engagementScore < 0.3) urgency = Math.min(urgency - 1, 1);
    if (engagementScore > 0.8) urgency = Math.min(urgency + 1, 10);
    
    return urgency;
  }

  private async predictEngagement(
    userId: string,
    type: string,
    title: string,
    message: string
  ): Promise<number> {
    // Simplified prediction - in real implementation, use ML model
    const userBehavior = await this.getUserBehaviorData(userId);
    const typeEngagement = userBehavior.preferred_notification_types.includes(type) ? 0.8 : 0.4;
    const titleScore = title.length > 10 && title.length < 60 ? 0.8 : 0.6;
    
    return (typeEngagement + titleScore + userBehavior.engagement_score) / 3;
  }

  private async predictUserInactivity(
    userBehavior: UserBehaviorData,
    historicalData: any[]
  ): Promise<{ probability: number }> {
    const daysSinceLastActivity = Math.floor(
      (Date.now() - userBehavior.last_activity.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const probability = Math.min(daysSinceLastActivity / 7, 1); // Linear increase over 7 days
    return { probability };
  }

  private async predictUpsellOpportunity(
    userBehavior: UserBehaviorData,
    historicalData: any[]
  ): Promise<{ probability: number; estimated_revenue: number }> {
    // Simplified upsell prediction
    const probability = userBehavior.engagement_score > 0.7 ? 0.6 : 0.2;
    const estimatedRevenue = probability * 100; // $100 average upsell
    
    return { probability, estimated_revenue: estimatedRevenue };
  }

  private async predictSupportNeeds(
    userBehavior: UserBehaviorData,
    historicalData: any[]
  ): Promise<{ probability: number }> {
    // Predict if user might need support based on behavior
    const probability = userBehavior.engagement_score < 0.3 ? 0.8 : 0.2;
    return { probability };
  }

  private getDefaultBehaviorData(userId: string): UserBehaviorData {
    return {
      user_id: userId,
      most_active_hours: [9, 10, 14, 15, 16], // Default business hours
      avg_response_time: 1800, // 30 minutes
      preferred_notification_types: ['system', 'business_update'],
      engagement_score: 0.5,
      timezone: 'UTC',
      device_types: ['web'],
      last_activity: new Date()
    };
  }

  private getDefaultPattern(type: string): NotificationPattern {
    return {
      type,
      frequency: 1,
      engagement_rate: 0.5,
      optimal_timing: [9, 14, 16],
      user_segments: ['general']
    };
  }

  // Additional helper methods
  private async getUserPreferences(userId: string): Promise<any> {
    try {
      const result = await query(`
        SELECT * FROM user_preferences 
        WHERE user_id = $1
      `, [getUserIdForDatabase(userId)])
      
      const data = result.rows[0]
      return data || { include_name: false, channel_preferences: ['in_app'] };
    } catch (error) {
      console.error('❌ Error fetching user preferences:', error)
      return { include_name: false, channel_preferences: ['in_app'] };
    }
  }

  private async getUserHistoricalData(userId: string): Promise<any[]> {
    try {
      const result = await query(`
        SELECT * FROM user_activity_history 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 100
      `, [getUserIdForDatabase(userId)])
      
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching user historical data:', error)
      return [];
    }
  }

  private analyzeNotificationRelationships(notifications: any[]): any[] {
    // Analyze relationships between notifications for grouping
    return notifications.map(n => ({ ...n, similarity_score: 0.5 }));
  }

  private groupBySimilarity(notifications: any[], relationships: any[]): any[][] {
    // Group notifications by similarity
    return [notifications]; // Simplified - would implement actual grouping logic
  }

  private applyBusinessGrouping(groups: any[][], userId: string): any[][] {
    // Apply business-specific grouping rules
    return groups;
  }

  private determineGroupingStrategy(groups: any[][]): string {
    return groups.length > 1 ? 'similarity_based' : 'single_group';
  }

  private async getPendingNotifications(userId: string): Promise<any[]> {
    try {
      const result = await query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 AND is_read = false 
        ORDER BY created_at DESC
      `, [parseInt(userId.toString())]) // Use integer for notifications table
      
      return result.rows || [];
    } catch (error) {
      console.error('❌ Error fetching pending notifications:', error)
      return [];
    }
  }

  private async createBasicNotification(request: SmartNotificationRequest): Promise<any> {
    try {
      console.log(`📝 Creating basic notification for user ${request.user_id}`)
      
      const result = await query(`
        INSERT INTO notifications (
          user_id, type, title, message, priority, metadata, is_read, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [
        parseInt(request.user_id.toString()), // Use integer for notifications table
        request.type,
        request.title,
        request.message,
        request.priority,
        JSON.stringify(request.metadata),
        false,
        new Date().toISOString()
      ])
      
      const data = result.rows[0]
      console.log(`✅ Basic notification created: ${data.id}`)
      
      return {
        notification_id: data.id,
        scheduled_time: new Date(),
        personalization_applied: false,
        ai_enhancements: {}
      };
    } catch (error) {
      console.error('❌ Error creating basic notification:', error)
      throw error;
    }
  }

  private async logAIDecision(notificationId: string, decision: any): Promise<void> {
    try {
      await query(`
        INSERT INTO ai_decision_log (notification_id, decision_data, created_at) 
        VALUES ($1, $2, $3)
      `, [
        notificationId,
        JSON.stringify(decision),
        new Date().toISOString()
      ])
      
      console.log(`🔬 AI decision logged for notification ${notificationId}`)
    } catch (error) {
      console.error('❌ Error logging AI decision:', error)
    }
  }
}

export { AINotificationService, type SmartNotificationRequest, type PredictiveInsight }; 