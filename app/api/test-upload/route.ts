import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Test upload endpoint triggered')
    
    const contentType = request.headers.get('content-type')
    console.log('Content-Type:', contentType)
    
    if (!contentType?.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Expected multipart/form-data' },
        { status: 400 }
      )
    }
    
    const formData = await request.formData()
    console.log('FormData received')
    
    // Extract all form data
    const data: Record<string, any> = {}
    for (const [key, value] of formData.entries()) {
      console.log(`FormData field: ${key} = ${typeof value === 'object' ? 'File' : value}`)
      data[key] = value
    }
    
    const audioFile = formData.get('audio_file') as File
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }
    
    console.log('Audio file details:', {
      name: audioFile.name,
      size: audioFile.size,
      type: audioFile.type
    })
    
    return NextResponse.json({
      success: true,
      message: 'File upload test successful',
      fileInfo: {
        name: audioFile.name,
        size: audioFile.size,
        type: audioFile.type
      },
      formData: Object.keys(data)
    })
    
  } catch (error) {
    console.error('❌ Test upload error:', error)
    return NextResponse.json(
      { 
        error: 'Test upload failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
} 