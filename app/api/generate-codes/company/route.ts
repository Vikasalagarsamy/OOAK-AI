import { NextRequest, NextResponse } from 'next/server'
import { generateCompanyCode } from '@/utils/code-generator'

export async function POST(request: NextRequest) {
  try {
    console.log('🏢 API: Generating company code')
    
    const companyCode = await generateCompanyCode()
    
    console.log(`✅ API: Generated company code: ${companyCode}`)
    
    return NextResponse.json({
      success: true,
      companyCode
    })
    
  } catch (error) {
    console.error('❌ API: Error generating company code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate company code' },
      { status: 500 }
    )
  }
}
