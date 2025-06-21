import { pool } from '@/lib/postgresql-client'

export interface QuotationData {
  client_name: string
  bride_name: string
  groom_name: string
  mobile: string
  email: string
  events: any[]
  default_package: string
}

export interface SavedQuotation {
  id: number
  quotation_number: string
  client_name: string
  total_amount: number
  status: string
  created_at: string
  quotation_data: QuotationData
}

export async function getQuotations(): Promise<{ success: boolean; quotations?: SavedQuotation[]; error?: string }> {
  try {
    const client = await pool.connect()
    const result = await client.query('SELECT * FROM quotations ORDER BY created_at DESC')
    client.release()
    
    return { 
      success: true, 
      quotations: result.rows.map(row => ({
        ...row,
        quotation_data: typeof row.quotation_data === 'string' ? JSON.parse(row.quotation_data) : row.quotation_data
      }))
    }
  } catch (error: any) {
    console.error('Error fetching quotations:', error)
    return { success: false, error: error.message }
  }
}

export async function createQuotation(quotationData: QuotationData): Promise<{ success: boolean; quotation?: SavedQuotation; error?: string }> {
  try {
    const client = await pool.connect()
    const quotationNumber = `QUO-${Date.now()}`
    
    const result = await client.query(
      `INSERT INTO quotations (quotation_number, client_name, bride_name, groom_name, mobile, email, default_package, total_amount, quotation_data, status, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        quotationNumber,
        quotationData.client_name,
        quotationData.bride_name,
        quotationData.groom_name,
        quotationData.mobile,
        quotationData.email,
        quotationData.default_package,
        0, // default total
        JSON.stringify(quotationData),
        'draft',
        new Date().toISOString()
      ]
    )
    
    client.release()
    
    const quotation = result.rows[0]
    return { 
      success: true, 
      quotation: {
        ...quotation,
        quotation_data: typeof quotation.quotation_data === 'string' ? JSON.parse(quotation.quotation_data) : quotation.quotation_data
      }
    }
  } catch (error: any) {
    console.error('Error creating quotation:', error)
    return { success: false, error: error.message }
  }
} 