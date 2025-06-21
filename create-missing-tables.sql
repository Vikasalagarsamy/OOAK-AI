-- Missing Tables Schema for Local Database
-- Run this in your LOCAL database (port 54321 or 54323)
-- Generated from remote database on: 2024

-- ============================================================================
-- CRITICAL MISSING TABLES (55 TABLES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS accounting_workflows (
    created_at TIMESTAMP WITH TIME ZONE,
    processed_by TEXT,
    total_amount DECIMAL,
    instruction_id INTEGER,
    payment_id INTEGER,
    status TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    payment_type TEXT,
    quotation_id INTEGER,
    id INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS action_recommendations (
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    is_completed BOOLEAN,
    completed_at TIMESTAMP WITH TIME ZONE,
    expected_impact JSONB,
    recommendation_type TEXT,
    reasoning TEXT,
    quotation_id INTEGER,
    id INTEGER,
    title TEXT,
    description TEXT,
    suggested_action TEXT,
    confidence_score DECIMAL,
    priority TEXT
);

CREATE TABLE IF NOT EXISTS ai_decision_log (
    notification_id TEXT,
    execution_time INTEGER,
    confidence_score DECIMAL,
    decision_data JSONB,
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    model_version TEXT,
    decision_type TEXT
);

CREATE TABLE IF NOT EXISTS ai_insights_summary (
    insight_type TEXT,
    user_id UUID,
    is_expired BOOLEAN,
    probability DECIMAL,
    created_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    recommended_action TEXT,
    expires_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS ai_performance_tracking (
    feedback_loop_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    confidence_score DECIMAL,
    model_type TEXT,
    accuracy_score DECIMAL,
    actual_outcome JSONB,
    prediction_data JSONB,
    id UUID,
    model_version TEXT
);

CREATE TABLE IF NOT EXISTS ai_recommendations (
    user_id UUID,
    id UUID,
    confidence_score DECIMAL,
    context_data JSONB,
    applied BOOLEAN,
    feedback_score INTEGER,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    recommendation_type TEXT,
    recommendation_data JSONB
);

CREATE TABLE IF NOT EXISTS analytics_cache (
    created_at TIMESTAMP WITH TIME ZONE,
    cache_type TEXT,
    cache_key TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    id UUID,
    cache_data JSONB
);

CREATE TABLE IF NOT EXISTS auditions (
    updated_at TIMESTAMP WITH TIME ZONE,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    date DATE,
    id UUID,
    description TEXT,
    status TEXT,
    location TEXT
);

CREATE TABLE IF NOT EXISTS bug_attachments (
    file_type TEXT,
    file_path TEXT,
    bug_id BIGINT,
    file_name TEXT,
    id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE,
    uploaded_by UUID,
    file_size INTEGER
);

CREATE TABLE IF NOT EXISTS bug_comments (
    updated_at TIMESTAMP WITH TIME ZONE,
    content TEXT,
    id BIGINT,
    bug_id BIGINT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS bugs (
    assignee_id UUID,
    severity TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    due_date TIMESTAMP WITH TIME ZONE,
    title TEXT,
    description TEXT,
    id BIGINT,
    reporter_id UUID
);

CREATE TABLE IF NOT EXISTS business_trends (
    previous_value DECIMAL,
    percentage_change DECIMAL,
    trend_type TEXT,
    trend_period TEXT,
    trend_direction TEXT,
    statistical_significance DECIMAL,
    insights JSONB,
    recommendations JSONB,
    analyzed_at TIMESTAMP WITH TIME ZONE,
    id INTEGER,
    trend_strength DECIMAL,
    current_value DECIMAL
);

CREATE TABLE IF NOT EXISTS call_insights (
    improvement_areas JSONB,
    decision_factors JSONB,
    pain_points JSONB,
    call_id TEXT,
    market_trends JSONB,
    competitive_mentions JSONB,
    id UUID,
    conversion_indicators JSONB,
    objection_patterns JSONB,
    successful_techniques JSONB,
    updated_at TIMESTAMP WITH TIME ZONE,
    pricing_feedback JSONB,
    service_feedback JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    preferences JSONB,
    concerns JSONB
);

CREATE TABLE IF NOT EXISTS chat_logs (
    name TEXT,
    channel TEXT,
    reply TEXT,
    id UUID,
    phone TEXT,
    message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS client_insights (
    client_name TEXT,
    price_sensitivity TEXT,
    optimal_follow_up_time TEXT,
    preferred_communication_method TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    last_analyzed_at TIMESTAMP WITH TIME ZONE,
    insights JSONB,
    decision_timeline_days INTEGER,
    conversion_probability DECIMAL,
    sentiment_score DECIMAL,
    engagement_level TEXT,
    id INTEGER,
    client_phone TEXT,
    client_email TEXT
);

CREATE TABLE IF NOT EXISTS company_partners (
    contract_details TEXT,
    company_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    contract_end_date DATE,
    partner_id INTEGER,
    contract_start_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS department_instructions (
    created_by TEXT,
    payment_id INTEGER,
    instructions JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    id INTEGER,
    quotation_id INTEGER,
    status TEXT
);

CREATE TABLE IF NOT EXISTS follow_up_auditions (
    notes TEXT,
    id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    follow_up_date DATE,
    audition_id UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    title TEXT
);

CREATE TABLE IF NOT EXISTS instruction_approvals (
    submitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    approved_by TEXT,
    id INTEGER,
    instruction_id INTEGER,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    approval_status TEXT
);

CREATE TABLE IF NOT EXISTS lead_drafts (
    id BIGINT,
    data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    phone TEXT,
    status TEXT
);

CREATE TABLE IF NOT EXISTS lead_followups (
    notes TEXT,
    id INTEGER,
    lead_id INTEGER,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE,
    completed_by UUID,
    workflow_stage TEXT,
    duration_minutes INTEGER,
    follow_up_required BOOLEAN,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    quotation_id INTEGER,
    contact_method TEXT,
    interaction_summary TEXT,
    status TEXT,
    outcome TEXT,
    priority TEXT,
    created_by TEXT,
    followup_type TEXT
);

CREATE TABLE IF NOT EXISTS lead_task_performance (
    sla_met BOOLEAN,
    task_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    revenue_impact DECIMAL,
    lead_id INTEGER,
    id INTEGER,
    completion_time_hours DECIMAL,
    response_time_hours DECIMAL
);

CREATE TABLE IF NOT EXISTS ml_model_performance (
    model_name TEXT,
    metric_type TEXT,
    training_date TIMESTAMP WITH TIME ZONE,
    dataset_size INTEGER,
    metric_value DECIMAL,
    id INTEGER,
    is_production_model BOOLEAN,
    evaluation_date TIMESTAMP WITH TIME ZONE,
    model_version TEXT
);

CREATE TABLE IF NOT EXISTS notification_batches (
    user_id INTEGER,
    id INTEGER,
    batch_key TEXT,
    notification_type TEXT,
    metadata JSONB,
    count INTEGER,
    last_sent TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notification_engagement (
    event_type TEXT,
    notification_id TEXT,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    engagement_data JSONB,
    id UUID
);

CREATE TABLE IF NOT EXISTS notification_preferences (
    updated_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    email_notifications BOOLEAN,
    push_notifications BOOLEAN,
    permission_changes BOOLEAN,
    role_assignments BOOLEAN,
    admin_role_changes BOOLEAN,
    security_permission_changes BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS notification_recipients (
    created_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN,
    user_id UUID,
    notification_id INTEGER,
    is_dismissed BOOLEAN
);

CREATE TABLE IF NOT EXISTS notification_rules (
    created_by INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    recipients TEXT[], -- Changed ARRAY to TEXT[]
    trigger_type TEXT,
    name TEXT,
    id TEXT,
    template_id TEXT,
    conditions JSONB,
    enabled BOOLEAN
);

CREATE TABLE IF NOT EXISTS partners (
    contact_person TEXT,
    address TEXT,
    partnership_type TEXT,
    phone TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    email TEXT,
    name TEXT,
    id INTEGER,
    partnership_start_date DATE
);

CREATE TABLE IF NOT EXISTS payments (
    payment_method TEXT,
    payment_type TEXT,
    id INTEGER,
    quotation_id INTEGER,
    amount DECIMAL,
    paid_by TEXT,
    payment_reference TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    status TEXT
);

CREATE TABLE IF NOT EXISTS personalization_learning (
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    id UUID,
    learning_weight DECIMAL,
    interaction_data JSONB,
    context_tags TEXT[], -- Changed ARRAY to TEXT[]
    outcome_positive BOOLEAN,
    interaction_type TEXT
);

CREATE TABLE IF NOT EXISTS post_sale_confirmations (
    follow_up_required BOOLEAN,
    updated_at TIMESTAMP,
    client_satisfaction_rating INTEGER,
    event_details_confirmed JSONB,
    deliverables_confirmed JSONB,
    services_confirmed JSONB,
    call_duration INTEGER,
    call_time TIME WITHOUT TIME ZONE,
    call_date DATE,
    confirmation_date TIMESTAMP,
    confirmed_by_user_id UUID,
    quotation_id INTEGER,
    id INTEGER,
    action_items TEXT,
    call_summary TEXT,
    additional_requests TEXT,
    client_concerns TEXT,
    client_expectations TEXT,
    confirmation_method TEXT,
    client_contact_person TEXT,
    created_at TIMESTAMP,
    attachments JSONB,
    follow_up_date DATE
);

CREATE TABLE IF NOT EXISTS post_sales_workflows (
    payment_id INTEGER,
    id INTEGER,
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    confirmed_by TEXT,
    client_name TEXT,
    instructions JSONB,
    instruction_id INTEGER,
    quotation_id INTEGER
);

CREATE TABLE IF NOT EXISTS predictive_insights (
    estimated_impact DECIMAL,
    status TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    id UUID,
    user_id UUID,
    recommended_action TEXT,
    insight_type TEXT,
    probability DECIMAL,
    trigger_conditions JSONB
);

CREATE TABLE IF NOT EXISTS profiles (
    department TEXT,
    location TEXT,
    phone TEXT,
    bio TEXT,
    job_title TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    employee_id INTEGER,
    full_name TEXT,
    id UUID
);

CREATE TABLE IF NOT EXISTS quotation_predictions (
    updated_at TIMESTAMP WITH TIME ZONE,
    actual_outcome TEXT,
    model_version TEXT,
    id INTEGER,
    quotation_id INTEGER,
    success_probability DECIMAL,
    confidence_score DECIMAL,
    prediction_factors JSONB,
    predicted_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS quotation_revisions (
    id INTEGER,
    original_quotation_id INTEGER,
    revision_number INTEGER,
    revised_quotation_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE,
    revised_by TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    status TEXT,
    revision_reason TEXT
);

CREATE TABLE IF NOT EXISTS quotation_workflow_history (
    quotation_id INTEGER,
    comments TEXT,
    performed_by UUID,
    performed_at TIMESTAMP,
    id INTEGER,
    action TEXT
);

CREATE TABLE IF NOT EXISTS quote_components (
    quantity INTEGER,
    unit_price DECIMAL,
    component_type TEXT,
    component_name TEXT,
    component_description TEXT,
    quote_id INTEGER,
    id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    sort_order INTEGER,
    metadata JSONB,
    subtotal DECIMAL
);

CREATE TABLE IF NOT EXISTS quote_deliverables_snapshots (
    deliverable_id INTEGER,
    quote_id INTEGER,
    id INTEGER,
    sort_order INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    deliverable_name TEXT,
    deliverable_type TEXT,
    tat INTEGER,
    timing_type TEXT,
    package_type TEXT,
    process_name TEXT
);

CREATE TABLE IF NOT EXISTS quote_services_snapshot (
    service_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    subtotal DECIMAL,
    quantity INTEGER,
    locked_price DECIMAL,
    service_name TEXT,
    package_type TEXT,
    quote_id INTEGER,
    id INTEGER
);

CREATE TABLE IF NOT EXISTS recent_business_notifications (
    minutes_ago DECIMAL,
    priority TEXT,
    quotation_id INTEGER,
    user_id INTEGER,
    title TEXT,
    message TEXT,
    id TEXT,
    is_read BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    type TEXT,
    action_url TEXT,
    action_label TEXT,
    metadata JSONB
);

CREATE TABLE IF NOT EXISTS rejected_leads_view (
    branch_name TEXT,
    company_name TEXT,
    rejection_timestamp TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    rejection_user TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    branch_id INTEGER,
    company_id INTEGER,
    id INTEGER,
    status TEXT,
    lead_number TEXT,
    client_name TEXT,
    rejection_details TEXT
);

CREATE TABLE IF NOT EXISTS system_logs (
    id INTEGER,
    action TEXT,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS team_members (
    joined_at TIMESTAMP WITH TIME ZONE,
    team_id INTEGER,
    employee_id INTEGER
);

CREATE TABLE IF NOT EXISTS team_performance_trends (
    total_revenue DECIMAL,
    total_conversions INTEGER,
    total_quotations INTEGER,
    period_end DATE,
    period_start DATE,
    underperformer_id TEXT,
    top_performer_id TEXT,
    id INTEGER,
    process_improvements_needed INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    coaching_opportunities INTEGER,
    team_activity_score DECIMAL,
    performance_variance DECIMAL,
    avg_sales_cycle_days INTEGER,
    avg_deal_size DECIMAL,
    team_conversion_rate DECIMAL
);

CREATE TABLE IF NOT EXISTS teams (
    name TEXT,
    id INTEGER,
    department_id INTEGER,
    team_lead_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_activity_history (
    ip_address INET,
    session_id TEXT,
    activity_type TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    activity_data JSONB,
    user_agent TEXT,
    id UUID
);

CREATE TABLE IF NOT EXISTS user_behavior_analytics (
    engagement_score DECIMAL,
    last_activity TIMESTAMP WITH TIME ZONE,
    total_notifications_received INTEGER,
    total_notifications_read INTEGER,
    average_read_time INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    device_types TEXT[], -- Changed ARRAY to TEXT[]
    timezone TEXT,
    preferred_notification_types TEXT[], -- Changed ARRAY to TEXT[]
    most_active_hours TEXT[], -- Changed ARRAY to TEXT[]
    id UUID,
    user_id UUID,
    avg_response_time INTEGER
);

CREATE TABLE IF NOT EXISTS user_engagement_analytics (
    context_data JSONB,
    device_type TEXT,
    channel TEXT,
    engagement_type TEXT,
    notification_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    time_to_engage INTEGER,
    engagement_value DECIMAL,
    user_id UUID,
    id UUID
);

CREATE TABLE IF NOT EXISTS user_engagement_summary (
    total_notifications_read INTEGER,
    read_rate DECIMAL,
    avg_response_time INTEGER,
    user_id UUID,
    engagement_score DECIMAL,
    total_notifications_received INTEGER,
    most_active_hours TEXT[], -- Changed ARRAY to TEXT[]
    last_activity TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS user_preferences (
    include_name BOOLEAN,
    user_id UUID,
    id UUID,
    name TEXT,
    quiet_hours_end INTEGER,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    ai_optimization_enabled BOOLEAN,
    frequency_limit INTEGER,
    quiet_hours_start INTEGER,
    personalization_level TEXT,
    channel_preferences TEXT[] -- Changed ARRAY to TEXT[]
);

CREATE TABLE IF NOT EXISTS webhook_logs (
    event_type TEXT,
    payload JSONB,
    received_at TIMESTAMP WITH TIME ZONE,
    id UUID
);

CREATE TABLE IF NOT EXISTS whatsapp_config (
    created_at TIMESTAMP WITH TIME ZONE,
    id UUID,
    business_phone_number_id TEXT,
    access_token TEXT,
    webhook_verify_token TEXT,
    webhook_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN
);

CREATE TABLE IF NOT EXISTS whatsapp_messages (
    status TEXT,
    user_id INTEGER,
    id UUID,
    notification_id TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    ai_personalization_score DECIMAL,
    ai_timing_score DECIMAL,
    template_id UUID,
    phone_number TEXT,
    message_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    message_id TEXT,
    delivered_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this after importing to verify all tables exist:
-- SELECT COUNT(*) as total_tables FROM information_schema.tables WHERE table_schema = 'public'; 