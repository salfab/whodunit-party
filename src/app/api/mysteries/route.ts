import { NextRequest, NextResponse } from 'next/server';
import { requireAdminSecret } from '@/lib/admin-auth';
import { createServiceClient } from '@/lib/supabase/server';
import {
  normalizeMysteryRoles,
  publicRoleToDatabaseRole,
} from '@/lib/mystery-role-normalization';
import { validateMysteryFull } from '@/lib/mystery-validation';

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
      .select('id, title, synopsis, description, language, author, theme, created_at, image_path')
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
  const authError = requireAdminSecret(request);
  if (authError) return authError;

  try {
    const body = normalizeMysteryRoles(await request.json()) as any;
    const supabase = await createServiceClient();

    const validation = validateMysteryFull(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors?.join('; ') },
        { status: 400 }
      );
    }

    const {
      title,
      synopsis,
      description,
      image_path,
      language,
      author,
      theme,
      word_pool,
      character_sheets,
    } = body;

    // Insert mystery
    const { data: mysteryData, error: mysteryError } = await (supabase
      .from('mysteries') as any)
      .insert({
        title,
        synopsis: synopsis || null,
        description,
        image_path: image_path || null,
        language,
        author: author || 'Built-in',
        theme: theme || 'SERIOUS_MURDER',
        word_pool,
      })
      .select()
      .single();
    
    const mystery = mysteryData as any;

    if (mysteryError) throw mysteryError;

    // Insert character sheets
    if (character_sheets && character_sheets.length > 0) {
      const sheetsToInsert = character_sheets.map((sheet: any) => ({
        mystery_id: mystery.id,
        role: publicRoleToDatabaseRole(sheet.role),
        character_name: sheet.character_name,
        occupation: sheet.occupation || null,
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
