import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

/**
 * GET /api/mysteries
 * Fetches all available mysteries, optionally filtered by language
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language');
    const includeCharacterCount = searchParams.get('includeCharacterCount') === 'true';

    let query = supabase
      .from('mysteries')
      .select('id, title, description, language, author, theme, created_at, image_path')
      .order('created_at', { ascending: false });

    // Filter by language if provided
    if (language) {
      query = query.eq('language', language);
    }

    const { data: mysteries, error } = await query;

    if (error) {
      console.error('Failed to fetch mysteries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch mysteries' },
        { status: 500 }
      );
    }

    let mysteriesWithCounts: any[] = mysteries || [];

    // Optionally include character sheet counts
    if (includeCharacterCount && mysteries) {
      mysteriesWithCounts = await Promise.all(
        mysteries.map(async (mystery: any) => {
          const { count, error: countError } = await supabase
            .from('character_sheets')
            .select('*', { count: 'exact', head: true })
            .eq('mystery_id', mystery.id);
          
          return { ...mystery, character_count: countError ? 0 : (count ?? 0) };
        })
      );
    }

    return NextResponse.json({ mysteries: mysteriesWithCounts });
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
      language,
      author,
      theme,
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
        language,
        author: author || 'Built-in',
        theme: theme || 'SERIOUS_MURDER',
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
