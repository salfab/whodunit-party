import { NextRequest, NextResponse } from 'next/server';
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
      .select('id, title, description, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch mysteries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mysteries' },
        { status: 500 }
      );
    }

    return NextResponse.json({ mysteries: mysteries || [] });
  } catch (error) {
    console.error('Unexpected error fetching mysteries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/mysteries
 * Create a new mystery
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createServiceClient();

    const {
      title,
      description,
      image_path,
      innocent_words,
      guilty_words,
      character_sheets,
    } = body;

    // Insert mystery
    const { data: mysteryData, error: mysteryError } = await (supabase
      .from('mysteries') as any)
      .insert({
        title,
        description,
        image_path: image_path || null,
        innocent_words,
        guilty_words,
      })
      .select()
      .single();
    
    const mystery = mysteryData as any;

    if (mysteryError) throw mysteryError;

    // Insert character sheets
    if (character_sheets && character_sheets.length > 0) {
      const sheetsToInsert = character_sheets.map((sheet: any) => ({
        mystery_id: mystery.id,
        role: sheet.role,
        character_name: sheet.character_name,
        dark_secret: sheet.dark_secret,
        alibi: sheet.alibi,
        image_path: sheet.image_path || null,
      }));

      const { error: sheetsError } = await (supabase
        .from('character_sheets') as any)
        .insert(sheetsToInsert);

      if (sheetsError) throw sheetsError;
    }

    return NextResponse.json({ id: mystery.id }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating mystery:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create mystery' },
      { status: 500 }
    );
  }
}
