import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/postgresql-client'

// Using centralized PostgreSQL client

export async function POST(request: NextRequest) {
  let client
  try {
    const { quotationId, paymentAmount, paymentType, paymentMethod, paymentReference, paidBy } = await request.json()
    console.log('💰 Processing payment for quotation:', quotationId, '(PostgreSQL)')

    client = await pool.connect()
    await client.query('BEGIN')

    const quotationResult = await client.query('SELECT * FROM quotations WHERE id = $1', [quotationId])
    if (quotationResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return NextResponse.json({ error: 'Quotation not found', source: 'PostgreSQL' }, { status: 404 })
    }

    const quotation = quotationResult.rows[0]
    const paymentValues = [quotationId, paymentAmount, paymentType, paymentMethod, paymentReference, paidBy, 'received', new Date().toISOString(), new Date().toISOString()]
    
    const paymentResult = await client.query(`
      INSERT INTO payments (quotation_id, amount, payment_type, payment_method, payment_reference, paid_by, status, received_at, created_at) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, paymentValues)

    const statusUpdate = 'approved'
    await client.query('UPDATE quotations SET status = $1, updated_at = $2 WHERE id = $3', [statusUpdate, new Date().toISOString(), quotationId])
    await client.query('COMMIT')

    return NextResponse.json({
      success: true,
      paymentRecord: paymentResult.rows[0],
      quotationNumber: quotation.quotation_number,
      message: 'Payment processed successfully in PostgreSQL',
      metadata: { 
        source: 'PostgreSQL', 
        payment_id: paymentResult.rows[0].id, 
        quotation_status: statusUpdate,
        payment_type: paymentType,
        timestamp: new Date().toISOString() 
      }
    })

  } catch (error: any) {
    if (client) await client.query('ROLLBACK')
    console.error('❌ Payment processing PostgreSQL error:', error)
    return NextResponse.json({ error: 'Failed to process payment', details: error.message, source: 'PostgreSQL' }, { status: 500 })
  } finally {
    if (client) client.release()
  }
} 