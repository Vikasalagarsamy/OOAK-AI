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
