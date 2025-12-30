import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { validateMysteryFull } from '@/lib/mystery-validation';
import { Database } from '@/types/database';

const log = createLogger('api.mysteries.bulk-create');

interface MysteryInput {
  title: string;
  synopsis?: string;
  description: string;
  image_path?: string;
  language: string;
  author?: string;
  theme?: string;
  innocent_words: string[];
  guilty_words: string[];
  character_sheets: Array<{
    role: 'investigator' | 'guilty' | 'innocent';
    character_name: string;
    occupation?: string;
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

    // Validate all mysteries against JSON schema and business rules
    for (let i = 0; i < mysteries.length; i++) {
      const mysteryInput = mysteries[i];
      const validation = validateMysteryFull(mysteryInput);
      
      if (!validation.valid) {
        log('error', 'Mystery validation failed', {
          index: i,
          title: mysteryInput.title,
          errors: validation.errors,
        });
        return NextResponse.json(
          {
            error: `Validation failed for mystery "${mysteryInput.title || `at index ${i}`}"`,
            details: validation.errors?.join('; '),
            mystery: mysteryInput.title,
            index: i,
          },
          { status: 400 }
        );
      }
    }

    log('info', 'All mysteries validated successfully');

    const supabase = await createServiceClient();
    const createdMysteries: Database['public']['Tables']['mysteries']['Row'][] = [];

    for (const mysteryInput of mysteries) {
      // Insert mystery
      log('info', 'Inserting mystery', { title: mysteryInput.title });
      const { data: mysteryData, error: mysteryError } = await (supabase
        .from('mysteries') as any)
        .insert({
          title: mysteryInput.title,
          synopsis: mysteryInput.synopsis || null,
          description: mysteryInput.description,
          image_path: mysteryInput.image_path || null,
          language: mysteryInput.language,
          author: mysteryInput.author || 'Built-in',
          theme: mysteryInput.theme || 'SERIOUS_MURDER',
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
        occupation: sheet.occupation || null,
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
