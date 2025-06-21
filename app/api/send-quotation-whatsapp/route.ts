import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const INTERAKT_API_KEY = process.env.INTERAKT_API_KEY

interface QuotationWebhookBody {
  quotationId: string
  clientWhatsApp: string
  amount: number
  clientName: string
  validityDays?: number // Optional: quote validity period
  paymentTerms?: string // Optional: payment terms
  additionalNotes?: string // Optional: any additional notes
  salesPerson?: string // Optional: sales person
}

export async function POST(request: Request) {
  try {
    if (!INTERAKT_API_KEY) {
      console.error('API Key not found in environment variables')
      throw new Error('Interakt API key not configured')
    }

    // Debug: Log first few characters of API key to verify it's loaded
    console.log('API Key available:', INTERAKT_API_KEY.substring(0, 4) + '...')

    const body: QuotationWebhookBody = await request.json()
    
    // Format amount with Indian currency format
    const formattedAmount = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(body.amount)

    // Calculate validity date if provided
    const validityDate = body.validityDays 
      ? new Date(Date.now() + (body.validityDays * 24 * 60 * 60 * 1000)).toLocaleDateString('en-IN')
      : 'NA'

    // Format the WhatsApp message
    const message = {
      countryCode: '91',
      phoneNumber: body.clientWhatsApp.replace('+91', '').replace(/\D/g, ''),
      type: 'Template',
      template: {
        name: 'quotation_ooak_qn',
        languageCode: 'en',
        headerValues: [],
        bodyValues: [
          body.clientName,                // {{1}} - Client name
          `https://ooak.com/quote/${body.quotationId}?amount=${body.amount}`, // {{2}} - Quotation link
          body.salesPerson || 'TEAM OOAK'  // {{3}} - Sales person or team name
        ]
      }
    }

    console.log('Preparing to send message:', {
      phoneNumber: message.phoneNumber,
      template: message.template.name,
      bodyValues: message.template.bodyValues,
      apiKeyLength: INTERAKT_API_KEY.length
    })

    try {
      // Send to Interakt API with key directly in header
      const response = await fetch('https://api.interakt.ai/v1/public/message/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${INTERAKT_API_KEY}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(message)
      })

      const responseText = await response.text()
      console.log('API Response Status:', response.status)
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()))
      console.log('API Response Body:', responseText)

      let errorData
      try {
        errorData = JSON.parse(responseText)
      } catch (e) {
        errorData = { message: responseText }
      }

      if (!response.ok) {
        console.error('Detailed Error:', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          body: errorData
        })
        throw new Error(`Failed to send WhatsApp message: ${errorData.message || response.statusText}`)
      }

      return NextResponse.json({
        success: true,
        messageId: errorData.messageId,
        template: message.template.name,
        recipient: body.clientWhatsApp,
        sentAt: new Date().toISOString()
      })

    } catch (apiError) {
      console.error('API Call Error:', apiError)
      throw new Error(`Failed to communicate with Interakt API: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`)
    }

  } catch (error) {
    console.error('WhatsApp API Error:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to send WhatsApp message',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
} 