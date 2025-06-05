import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/actions/auth-actions'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    console.log('🔍 Test API - Current user:', currentUser)
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only allow admins to create test notifications
    if (!currentUser.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const userId = typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id
    console.log('🔍 Test API - Parsed userId:', userId, 'type:', typeof userId)

    // Create sample notifications for testing
    const sampleNotifications = [
      {
        user_id: userId,
        type: 'overdue' as const,
        priority: 'urgent' as const,
        title: 'Quotation #123 is overdue',
        message: 'ABC Corp quotation has been overdue for 5 days in pending_approval stage',
        quotation_id: 123,
        action_url: '/sales/quotations?focus=123',
        action_label: 'View & Take Action',
        metadata: {
          days_overdue: 5,
          client_name: 'ABC Corp',
          value_at_risk: 150000
        }
      },
      {
        user_id: userId,
        type: 'approval_needed' as const,
        priority: 'high' as const,
        title: 'New quotation pending your approval',
        message: 'XYZ Ltd - ₹2,50,000 quotation needs approval',
        quotation_id: 124,
        action_url: '/sales/quotations?focus=124',
        action_label: 'Approve/Reject',
        metadata: {
          quotation_value: 250000,
          client_name: 'XYZ Ltd'
        }
      },
      {
        user_id: userId,
        type: 'payment_received' as const,
        priority: 'medium' as const,
        title: '🎉 Payment received for DEF Inc',
        message: '₹1,75,000 payment confirmed. Ready for delivery confirmation.',
        quotation_id: 125,
        action_url: '/sales/quotations?focus=125',
        action_label: 'Confirm Delivery',
        metadata: {
          payment_amount: 175000,
          client_name: 'DEF Inc'
        }
      },
      {
        user_id: userId,
        type: 'client_followup' as const,
        priority: 'medium' as const,
        title: 'Follow up with GHI Corp',
        message: 'Quotation worth ₹3,00,000 needs client follow-up',
        quotation_id: 126,
        action_url: '/sales/quotations?focus=126',
        action_label: 'Contact Client',
        metadata: {
          client_name: 'GHI Corp',
          quotation_value: 300000
        }
      },
      {
        user_id: userId,
        type: 'automation' as const,
        priority: 'low' as const,
        title: '🤖 Automation: Status Updated',
        message: 'System automatically updated status for JKL Ltd',
        quotation_id: 127,
        action_url: '/sales/quotations?focus=127',
        action_label: 'View Details',
        metadata: {
          automation_action: 'status_updated',
          client_name: 'JKL Ltd'
        }
      }
    ]

    console.log('🔍 Test API - Creating notifications for userId:', userId)
    
    const createdNotifications = []
    const errors = []

    for (let i = 0; i < sampleNotifications.length; i++) {
      const notification = sampleNotifications[i]
      console.log(`🔍 Test API - Creating notification ${i + 1}:`, notification)
      
      try {
        const notificationId = await NotificationService.createNotification(notification)
        console.log(`🔍 Test API - Created notification ${i + 1} with ID:`, notificationId)
        
        if (notificationId) {
          createdNotifications.push(notificationId)
        } else {
          errors.push(`Failed to create notification ${i + 1}: No ID returned`)
        }
      } catch (error) {
        console.error(`🔍 Test API - Error creating notification ${i + 1}:`, error)
        errors.push(`Failed to create notification ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    console.log('🔍 Test API - Summary:', {
      attempted: sampleNotifications.length,
      created: createdNotifications.length,
      errors: errors.length
    })

    return NextResponse.json({
      success: true,
      message: `Created ${createdNotifications.length} sample notifications${errors.length > 0 ? ` (${errors.length} errors)` : ''}`,
      notification_ids: createdNotifications,
      errors: errors.length > 0 ? errors : undefined,
      debug: {
        user_id: userId,
        user_type: typeof userId,
        attempted: sampleNotifications.length,
        created: createdNotifications.length
      }
    })

  } catch (error) {
    console.error('🔍 Test API - Top level error:', error)
    return NextResponse.json(
      { error: 'Failed to create sample notifications', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 