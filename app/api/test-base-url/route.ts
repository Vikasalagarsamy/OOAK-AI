import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://portal.ooak.photography';
  
  return NextResponse.json({
    baseUrl,
    envVar: process.env.NEXT_PUBLIC_BASE_URL,
    defaultFallback: 'https://portal.ooak.photography'
  });
} 