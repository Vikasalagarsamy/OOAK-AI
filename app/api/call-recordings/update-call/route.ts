import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/postgresql-client-unified';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { call_id, phone_number, recording_url, duration } = body;

    console.log('📝 Updating call record:', { call_id, phone_number, recording_url, duration });

    // Find the call record to update
    let query = query(`SELECT ${params} FROM ${table}`);
    
    if (call_id) {
      query = query.eq('id', call_id);
    } else if (phone_number) {
      // Find most recent call for this phone number
      query = query
        .eq('phone_number', phone_number)
        .eq('sales_agent', 'EMP-25-0001')
        .order('created_at', { ascending: false })
        .limit(1);
    } else {
      return NextResponse.json({ 
        error: 'Either call_id or phone_number is required' 
      }, { status: 400 });
    }

    const { data: callRecord, error: fetchError } = await query.single();

    if (fetchError || !callRecord) {
      console.error('❌ Call record not found:', fetchError?.message);
      return NextResponse.json({ 
        error: 'Call record not found',
        details: fetchError?.message 
      }, { status: 404 });
    }

    console.log('📞 Found call record:', {
      id: callRecord.id,
      current_recording_url: callRecord.recording_url,
      current_duration: callRecord.duration
    });

    // Update the call record
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (recording_url) updateData.recording_url = recording_url;
    if (duration !== undefined) updateData.duration = duration;
    if (recording_url) {
      updateData.transcript = `${callRecord.call_direction || 'outgoing'} call completed successfully - recording available`;
      updateData.status = 'completed';
    }

    const { data: updatedCall, error: updateError } = await supabase
      .from('call_transcriptions')
      .update(updateData)
      .eq('id', callRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Failed to update call:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update call',
        details: updateError.message 
      }, { status: 500 });
    }

    console.log('✅ Successfully updated call record');
    
    return NextResponse.json({
      success: true,
      message: 'Call record updated successfully',
      data: {
        call_id: updatedCall.id,
        recording_url: updatedCall.recording_url,
        duration: updatedCall.duration,
        status: updatedCall.status,
        updated_at: updatedCall.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Update call API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 