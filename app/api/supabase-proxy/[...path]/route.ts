import { NextRequest, NextResponse } from 'next/server'

/**
 * 🌉 SUPABASE PROXY FOR TUNNEL ACCESS
 * 
 * This proxy allows remote users (like Durga) to access the local Supabase instance
 * through the Cloudflare tunnel by routing requests through the Next.js app
 */

const LOCAL_SUPABASE_URL = 'http://127.0.0.1:54321'

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return handleSupabaseProxy(request, resolvedParams.path, 'GET')
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return handleSupabaseProxy(request, resolvedParams.path, 'POST')
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return handleSupabaseProxy(request, resolvedParams.path, 'PUT')
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return handleSupabaseProxy(request, resolvedParams.path, 'DELETE')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const resolvedParams = await params
  return handleSupabaseProxy(request, resolvedParams.path, 'PATCH')
}

async function handleSupabaseProxy(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    // Reconstruct the original Supabase API path
    const supabasePath = pathSegments.join('/')
    const searchParams = request.nextUrl.searchParams.toString()
    const proxyUrl = `${LOCAL_SUPABASE_URL}/${supabasePath}${searchParams ? `?${searchParams}` : ''}`

    console.log(`🌉 Proxying Supabase ${method} request: ${proxyUrl}`)

    // Forward headers (excluding host)
    const headers = new Headers()
    request.headers.forEach((value, key) => {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        headers.set(key, value)
      }
    })

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    }

    // Add body for POST/PUT/PATCH requests
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      requestOptions.body = await request.text()
    }

    // Make the proxied request to local Supabase
    const response = await fetch(proxyUrl, requestOptions)
    
    // Get response data
    const responseText = await response.text()
    
    // Create response with CORS headers
    const proxyResponse = new NextResponse(responseText, {
      status: response.status,
      statusText: response.statusText,
    })

    // Copy response headers
    response.headers.forEach((value, key) => {
      proxyResponse.headers.set(key, value)
    })

    // Add CORS headers for tunnel access
    proxyResponse.headers.set('Access-Control-Allow-Origin', '*')
    proxyResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS')
    proxyResponse.headers.set('Access-Control-Allow-Headers', '*')

    console.log(`✅ Supabase proxy successful: ${response.status}`)
    return proxyResponse

  } catch (error) {
    console.error('❌ Supabase proxy error:', error)
    return NextResponse.json({
      error: 'Proxy failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  })
} 