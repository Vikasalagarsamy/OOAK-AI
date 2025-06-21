import { NextRequest, NextResponse } from 'next/server'
import { generateBranchCode } from '@/utils/code-generator'

export async function POST(request: NextRequest) {
  try {
    const { companyCode, branchName, currentBranchCode } = await request.json()
    
    if (!companyCode || !branchName) {
      return NextResponse.json(
        { success: false, error: 'Company code and branch name are required' },
        { status: 400 }
      )
    }

    console.log(`🏷️ API: Generating branch code for company: ${companyCode}, branch: ${branchName}`)
    
    const branchCode = await generateBranchCode(companyCode, branchName, currentBranchCode)
    
    console.log(`✅ API: Generated branch code: ${branchCode}`)
    
    return NextResponse.json({
      success: true,
      branchCode
    })
    
  } catch (error) {
    console.error('❌ API: Error generating branch code:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate branch code' },
      { status: 500 }
    )
  }
}
