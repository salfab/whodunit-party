import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { Database } from '@/types/database';

const log = createLogger('api.mysteries.bulk-create');

interface MysteryInput {
  title: string;
  description: string;
  image_path?: string;
  innocent_words: string[];
  guilty_words: string[];
  character_sheets: Array<{
    role: 'investigator' | 'guilty' | 'innocent';
    character_name: string;
    dark_secret: string;
    words_to_place: string[];
    alibi: string;
    image_path?: string;
  }>;
}

interface BulkCreateBody {
  mysteries: MysteryInput[];
}

/**
 * POST /api/mysteries/bulk-create
 * Creates multiple mysteries with their character sheets
 */
export async function POST(request: NextRequest) {
  try {
    const body: BulkCreateBody = await request.json();
    const { mysteries } = body;

    if (!mysteries || !Array.isArray(mysteries)) {
      return NextResponse.json(
        { error: 'Mysteries array is required' },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    const createdMysteries: Database['public']['Tables']['mysteries']['Row'][] = [];

    for (const mysteryInput of mysteries) {
      // Validate word counts
      if (!mysteryInput.innocent_words || mysteryInput.innocent_words.length !== 3) {
        return NextResponse.json(
          { error: `Mystery "${mysteryInput.title}" must have exactly 3 innocent_words` },
          { status: 400 }
        );
      }
      if (!mysteryInput.guilty_words || mysteryInput.guilty_words.length !== 3) {
        return NextResponse.json(
          { error: `Mystery "${mysteryInput.title}" must have exactly 3 guilty_words` },
          { status: 400 }
        );
      }

      // Insert mystery
      const { data: mysteryData, error: mysteryError } = await (supabase
        .from('mysteries') as any)
        .insert({
          title: mysteryInput.title,
          description: mysteryInput.description,
          image_path: mysteryInput.image_path || null,
          innocent_words: mysteryInput.innocent_words,
          guilty_words: mysteryInput.guilty_words,
        })
        .single();
      
      const mystery = mysteryData as any;

      if (mysteryError || !mystery) {
        log('error', 'Failed to create mystery', { error: mysteryError?.message });
        return NextResponse.json(
          { error: `Failed to create mystery: ${mysteryInput.title}` },
          { status: 500 }
        );
      }

      // Insert character sheets
      const characterSheets = mysteryInput.character_sheets.map((sheet) => ({
        mystery_id: mystery.id,
        role: sheet.role,
        character_name: sheet.character_name,
        dark_secret: sheet.dark_secret,
        words_to_place: sheet.words_to_place,
        alibi: sheet.alibi,
        image_path: sheet.image_path || null,
      }));

      const { error: sheetsError } = await (supabase
        .from('character_sheets') as any)
        .insert(characterSheets);

      if (sheetsError) {
        log('error', 'Failed to create character sheets', { error: sheetsError.message });
        // Clean up the mystery we just created
        await supabase.from('mysteries').delete().eq('id', mystery.id);
        return NextResponse.json(
          { error: `Failed to create character sheets for: ${mysteryInput.title}` },
          { status: 500 }
        );
      }

      createdMysteries.push(mystery);
      log('info', 'Mystery created', {
        mysteryId: mystery.id,
        title: mystery.title,
        sheetCount: characterSheets.length,
      });
    }

    return NextResponse.json({
      success: true,
      count: createdMysteries.length,
      mysteries: createdMysteries,
    });
  } catch (error) {
    log('error', 'Unexpected error creating mysteries', { error });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
