import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    
    // Security: validate filename to prevent directory traversal
    if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 });
    }
    
    console.log(`🎵 Serving audio file: ${filename}`);
    
    // Construct file path
    const filePath = join(process.cwd(), 'uploads', 'call-recordings', filename);
    
    // Check if file exists
    try {
      await access(filePath, constants.F_OK);
    } catch (error) {
      console.error(`❌ File not found: ${filePath}`);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    
    // Read file
    const fileBuffer = await readFile(filePath);
    
    // Determine content type based on file extension
    const extension = filename.split('.').pop()?.toLowerCase();
    let contentType = 'audio/mpeg'; // default
    
    switch (extension) {
      case 'mp3':
        contentType = 'audio/mpeg';
        break;
      case 'wav':
        contentType = 'audio/wav';
        break;
      case 'm4a':
        contentType = 'audio/mp4';
        break;
      case '3gp':
        contentType = 'audio/3gpp';
        break;
      case 'amr':
        contentType = 'audio/amr';
        break;
      case 'aac':
        contentType = 'audio/aac';
        break;
      default:
        contentType = 'audio/mpeg';
    }
    
    console.log(`✅ Serving file: ${filename} (${fileBuffer.length} bytes, ${contentType})`);
    
    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Disposition': `inline; filename="${filename}"`,
        'Accept-Ranges': 'bytes'
      }
    });
    
  } catch (error) {
    console.error('❌ Error serving audio file:', error);
    return NextResponse.json({ 
      error: 'Failed to serve file',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 