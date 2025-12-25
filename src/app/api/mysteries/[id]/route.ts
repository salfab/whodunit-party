import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

// GET /api/mysteries/[id] - Get single mystery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    // Get single mystery with character sheets
    const { data: mystery, error: mysteryError } = await supabase
      .from('mysteries')
      .select('*')
      .eq('id', id)
      .single();

    if (mysteryError) throw mysteryError;
    if (!mystery) {
      return NextResponse.json({ error: 'Mystery not found' }, { status: 404 });
    }

    const { data: characterSheets, error: sheetsError } = await supabase
      .from('character_sheets')
      .select('*')
      .eq('mystery_id', id)
      .order('role');

    if (sheetsError) throw sheetsError;

    return NextResponse.json({
      ...(mystery as any),
      character_sheets: characterSheets || [],
    });
  } catch (error: any) {
    console.error('Error fetching mystery:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mystery' },
      { status: 500 }
    );
  }
}

// PUT /api/mysteries/[id] - Update mystery
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Update mystery
    const { error: mysteryError } = await (supabase
      .from('mysteries') as any)
      .update({
        title,
        description,
        image_path: image_path || null,
        innocent_words,
        guilty_words,
      })
      .eq('id', id);

    if (mysteryError) throw mysteryError;

    // Delete existing character sheets
    const { error: deleteError } = await supabase
      .from('character_sheets')
      .delete()
      .eq('mystery_id', id);

    if (deleteError) throw deleteError;

    // Insert new character sheets
    if (character_sheets && character_sheets.length > 0) {
      const sheetsToInsert = character_sheets.map((sheet: any) => ({
        mystery_id: id,
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating mystery:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update mystery' },
      { status: 500 }
    );
  }
}

// DELETE /api/mysteries/[id] - Delete mystery
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createServiceClient();

    // Delete character sheets first (cascade should handle this, but being explicit)
    const { error: sheetsError } = await supabase
      .from('character_sheets')
      .delete()
      .eq('mystery_id', id);

    if (sheetsError) throw sheetsError;

    // Delete mystery
    const { error: mysteryError } = await supabase
      .from('mysteries')
      .delete()
      .eq('id', id);

    if (mysteryError) throw mysteryError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting mystery:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete mystery' },
      { status: 500 }
    );
  }
}
