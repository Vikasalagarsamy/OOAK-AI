# Leads Schema Enhancement

## Overview
Enhanced the leads table with comprehensive fields for better lead management, tracking, and AI-powered insights.

## New Columns Added

### Priority & Value Tracking
- `priority` - Lead priority level (low, medium, high, urgent)
- `expected_value` - Expected monetary value of the lead
- `budget_range` - Client budget range (e.g., '50k-100k')

### Contact & Follow-up Management
- `last_contact_date` - Date of last contact with the lead
- `next_follow_up_date` - Scheduled date for next follow-up
- `conversion_stage` - Current stage in the conversion funnel
- `lead_score` - AI-calculated lead score (0-100)

### Event-Specific Fields
- `wedding_date` - Wedding date for wedding-related leads
- `venue_preference` - Preferred venue or location
- `guest_count` - Expected number of guests
- `tags` - Array of tags for lead categorization
- `description` - Detailed description of lead requirements

### Rejection Tracking
- `rejection_reason` - Reason for lead rejection
- `rejection_date` - Date when lead was rejected

## API Enhancements

### Enhanced Lead Data Structure
Each lead now includes:
- **Core Information**: Basic lead details with enhanced descriptions
- **Priority & Value**: Expected value, budget range, priority level
- **Contact Tracking**: Last contact date, follow-up schedules, urgency levels
- **Event Details**: Wedding dates, venue preferences, guest counts
- **AI Insights**: Lead scores, engagement levels, recommended actions

### Smart Lead Prioritization
Leads are now automatically prioritized by:
1. Overdue follow-ups (highest priority)
2. New leads
3. Urgent priority leads
4. High priority leads
5. Everything else

### AI-Powered Recommendations
The API now provides intelligent recommendations such as:
- "URGENT: Follow-up overdue - Contact immediately"
- "High Priority: Contact within next 2 hours"
- "Wedding approaching: Finalize details and confirm bookings"
- "Send quotation: Lead is engaged and ready for pricing"

### Enhanced Summary Statistics
- Total pipeline value tracking
- Average lead value calculations
- Priority-based lead counts
- Lead score averages
- Contact activity tracking

### Comprehensive Insights
The API provides categorized insights:
- **Priority Leads**: Overdue and urgent leads requiring immediate attention
- **High Value Leads**: Leads with expected value > 100k
- **Wedding Leads**: All wedding-related opportunities
- **Recent Activity**: Leads contacted within last 3 days
- **Requires Attention**: Leads needing immediate action

## Health Score Algorithm
The AI calculates lead health scores based on:

### Positive Factors (+points)
- Call count and engagement
- Quotation sent
- High expected value
- Qualified/contacted status
- High priority level
- Advanced conversion stage
- Wedding leads (often higher value)

### Negative Factors (-points)
- Lead age without contact
- Overdue follow-ups
- New leads without quick response
- Long periods since last contact
- Stale leads

## Sample Data
Added 5 diverse sample leads showcasing:
- High-priority wedding lead (urgent, high value)
- Corporate event lead (medium-high value)
- Overdue follow-up lead (requires immediate attention)
- Premium corporate client (highest value)
- Budget-conscious family event (low priority)

## Performance Optimizations
Added database indexes for:
- Priority levels
- Expected values
- Contact dates
- Follow-up dates
- Conversion stages
- Lead scores
- Wedding dates

## Usage Example
```bash
curl -X GET "http://localhost:3000/api/leads/my-leads"
```

The API now returns rich, actionable lead data with AI-powered insights to help sales teams prioritize their efforts and maximize conversion rates. 