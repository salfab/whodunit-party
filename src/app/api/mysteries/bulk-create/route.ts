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
    log('info', 'Bulk create mysteries request received');
    const body: BulkCreateBody = await request.json();
    const { mysteries } = body;

    if (!mysteries || !Array.isArray(mysteries)) {
      log('error', 'Invalid request body', { 
        hasMysteriesField: !!mysteries, 
        isArray: Array.isArray(mysteries) 
      });
      return NextResponse.json(
        { error: 'Mysteries array is required', details: 'Request body must contain a "mysteries" array' },
        { status: 400 }
      );
    }

    log('info', 'Processing mysteries', { count: mysteries.length });
    const supabase = await createServiceClient();
    const createdMysteries: Database['public']['Tables']['mysteries']['Row'][] = [];

    for (const mysteryInput of mysteries) {
      log('info', 'Validating mystery', { title: mysteryInput.title });
      
      // Validate word counts
      if (!mysteryInput.innocent_words || mysteryInput.innocent_words.length !== 3) {
        log('error', 'Invalid innocent_words count', { 
          title: mysteryInput.title,
          count: mysteryInput.innocent_words?.length,
          words: mysteryInput.innocent_words
        });
        return NextResponse.json(
          { 
            error: `Mystery "${mysteryInput.title}" must have exactly 3 innocent_words`,
            details: `Found ${mysteryInput.innocent_words?.length || 0} innocent words, expected 3`,
            mystery: mysteryInput.title
          },
          { status: 400 }
        );
      }
      if (!mysteryInput.guilty_words || mysteryInput.guilty_words.length !== 3) {
        log('error', 'Invalid guilty_words count', { 
          title: mysteryInput.title,
          count: mysteryInput.guilty_words?.length,
          words: mysteryInput.guilty_words
        });
        return NextResponse.json(
          { 
            error: `Mystery "${mysteryInput.title}" must have exactly 3 guilty_words`,
            details: `Found ${mysteryInput.guilty_words?.length || 0} guilty words, expected 3`,
            mystery: mysteryInput.title
          },
          { status: 400 }
        );
      }

      // Insert mystery
      log('info', 'Inserting mystery', { title: mysteryInput.title });
      const { data: mysteryData, error: mysteryError } = await (supabase
        .from('mysteries') as any)
        .insert({
          title: mysteryInput.title,
          description: mysteryInput.description,
          image_path: mysteryInput.image_path || null,
          innocent_words: mysteryInput.innocent_words,
          guilty_words: mysteryInput.guilty_words,
        })
        .select()
        .single();
      
      const mystery = mysteryData as any;

      if (mysteryError || !mystery) {
        // Log the full error object to capture all properties
        log('error', 'Failed to create mystery', { 
          title: mysteryInput.title,
          mysteryError: mysteryError ? JSON.stringify(mysteryError, null, 2) : 'null',
          errorMessage: mysteryError?.message,
          errorCode: mysteryError?.code,
          errorDetails: mysteryError?.details,
          errorHint: mysteryError?.hint,
          hasData: !!mysteryData,
          mysteryData: mysteryData ? JSON.stringify(mysteryData) : 'null'
        });
        return NextResponse.json(
          { 
            error: `Failed to create mystery: ${mysteryInput.title}`,
            details: mysteryError?.message || 'Database insert failed',
            code: mysteryError?.code,
            hint: mysteryError?.hint,
            mystery: mysteryInput.title
          },
          { status: 500 }
        );
      }

      log('info', 'Mystery created successfully', { 
        mysteryId: mystery.id, 
        title: mystery.title,
        characterSheetCount: mysteryInput.character_sheets.length
      });

      // Insert character sheets
      const characterSheets = mysteryInput.character_sheets.map((sheet) => ({
        mystery_id: mystery.id,
        role: sheet.role,
        character_name: sheet.character_name,
        dark_secret: sheet.dark_secret,
        alibi: sheet.alibi,
        image_path: sheet.image_path || null,
      }));

      log('info', 'Inserting character sheets', { 
        mysteryId: mystery.id,
        sheetCount: characterSheets.length
      });

      const { error: sheetsError } = await (supabase
        .from('character_sheets') as any)
        .insert(characterSheets);

      if (sheetsError) {
        log('error', 'Failed to create character sheets', { 
          mysteryId: mystery.id,
          title: mysteryInput.title,
          sheetsError: JSON.stringify(sheetsError, null, 2),
          errorMessage: sheetsError.message,
          errorCode: sheetsError.code,
          errorDetails: sheetsError.details,
          errorHint: sheetsError.hint,
          sheetCount: characterSheets.length,
          characterSheets: JSON.stringify(characterSheets)
        });
        // Clean up the mystery we just created
        log('info', 'Cleaning up mystery after character sheet failure', { mysteryId: mystery.id });
        await supabase.from('mysteries').delete().eq('id', mystery.id);
        return NextResponse.json(
          { 
            error: `Failed to create character sheets for: ${mysteryInput.title}`,
            details: sheetsError.message,
            code: sheetsError.code,
            hint: sheetsError.hint,
            mystery: mysteryInput.title,
            mysteryId: mystery.id
          },
          { status: 500 }
        );
      }

      createdMysteries.push(mystery);
      log('info', 'Mystery and character sheets created successfully', {
        mysteryId: mystery.id,
        title: mystery.title,
        sheetCount: characterSheets.length,
      });
    }

    log('info', 'Bulk create completed successfully', { 
      totalCreated: createdMysteries.length,
      mysteryIds: createdMysteries.map(m => m.id)
    });
    
    return NextResponse.json({
      success: true,
      count: createdMysteries.length,
      mysteries: createdMysteries,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    log('error', 'Unexpected error creating mysteries', { 
      error: errorMessage,
      stack: errorStack,
      type: error?.constructor?.name
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        type: error instanceof Error ? error.constructor.name : 'UnknownError'
      },
      { status: 500 }
    );
  }
}
