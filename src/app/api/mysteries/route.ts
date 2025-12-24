import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/mysteries
 * Fetches all available mysteries
 */
export async function GET() {
  try {
    const supabase = await createServiceClient();

    const { data: mysteries, error } = await supabase
      .from('mysteries')
      .select('id, title, description')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch mysteries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mysteries' },
        { status: 500 }
      );
    }

    return NextResponse.json(mysteries || []);
  } catch (error) {
    console.error('Unexpected error fetching mysteries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
