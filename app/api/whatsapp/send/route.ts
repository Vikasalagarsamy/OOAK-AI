import { NextRequest, NextResponse } from 'next/server'
import { whatsappService } from '@/lib/whatsapp-service'
import { getCurrentUser } from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId, phoneNumber, message, notificationId, templateId } = await req.json()

    if (!userId || !phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, phoneNumber, message' },
        { status: 400 }
      )
    }

    const result = await whatsappService.sendMessage({
      userId,
      phoneNumber,
      messageContent: message,
      notificationId,
      templateId
    })

    if (result.success) {
      return NextResponse.json({
        success: true,
        messageId: result.messageId,
        message: 'WhatsApp message sent successfully'
      })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('WhatsApp send API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 