import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';
import { validateMysteryFull } from '@/lib/mystery-validation';
import JSZip from 'jszip';

const log = createLogger('api.mysteries.upload-pack');

const MYSTERY_IMAGES_BUCKET = 'mystery-images';

interface MysteryJson {
  title: string;
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

/**
 * POST /api/mysteries/upload-pack
 * Upload a zip file containing mystery.json and images
 * 
 * Expected zip structure:
 * - mystery.json (required)
 * - images/ (optional folder)
 *   - cover.jpg
 *   - character1.jpg
 *   - etc.
 */
export async function POST(request: NextRequest) {
  try {
    log('info', 'Mystery pack upload request received');

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided', details: 'Request must include a zip file' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.zip')) {
      return NextResponse.json(
        { error: 'Invalid file type', details: 'File must be a .zip archive' },
        { status: 400 }
      );
    }

    log('info', 'Processing zip file', { filename: file.name, size: file.size });

    // Read and parse zip file
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find mystery.json
    const mysteryJsonFile = zip.file('mystery.json');
    if (!mysteryJsonFile) {
      return NextResponse.json(
        { error: 'Missing mystery.json', details: 'Zip must contain a mystery.json file at root level' },
        { status: 400 }
      );
    }

    // Parse mystery.json
    const mysteryJsonContent = await mysteryJsonFile.async('string');
    let mysteriesData: MysteryJson[];
    try {
      const parsed = JSON.parse(mysteryJsonContent);
      // Support both single mystery object and array of mysteries
      mysteriesData = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON', details: 'mystery.json is not valid JSON' },
        { status: 400 }
      );
    }

    if (mysteriesData.length === 0) {
      return NextResponse.json(
        { error: 'No mysteries found', details: 'mystery.json must contain at least one mystery' },
        { status: 400 }
      );
    }

    // Check for null/undefined elements
    const invalidIndex = mysteriesData.findIndex(m => !m || typeof m !== 'object');
    if (invalidIndex !== -1) {
      return NextResponse.json(
        { error: 'Invalid mystery data', details: `Mystery at index ${invalidIndex} is null, undefined, or not an object` },
        { status: 400 }
      );
    }

    const supabase = await createServiceClient();
    const uploadedMysteries = [];

    // Process each mystery
    for (let i = 0; i < mysteriesData.length; i++) {
      const mysteryData = mysteriesData[i];
      
      // Validate against schema
      const validation = validateMysteryFull(mysteryData);
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: `Mystery ${i + 1} "${mysteryData?.title || 'unknown'}": ${validation.errors?.join('; ')}`,
          },
          { status: 400 }
        );
      }

      log('info', 'Mystery validated successfully', { title: mysteryData.title });
      
      // Generate unique folder for this mystery's images
      const mysterySlug = mysteryData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
      const timestamp = Date.now();
      const imageFolder = `${mysterySlug}-${timestamp}`;

      // Collect all image paths referenced in the JSON
      const referencedImages = new Set<string>();
      if (mysteryData.image_path) {
        referencedImages.add(mysteryData.image_path);
      }
      for (const sheet of mysteryData.character_sheets) {
        if (sheet.image_path) {
          referencedImages.add(sheet.image_path);
        }
      }

      log('info', 'Found referenced images in JSON', { 
        count: referencedImages.size, 
        paths: Array.from(referencedImages) 
      });

      // Upload images and build path mapping
      const pathMapping = new Map<string, string>();

      for (const imagePath of referencedImages) {
      // Try to find the file in the zip (try exact path and with/without leading slash)
      const possiblePaths = [
        imagePath,
        imagePath.replace(/^\/+/, ''), // Remove leading slashes
        `images/${imagePath}`, // Try in images folder
        `images/${imagePath.replace(/^\/+/, '')}`, // Try in images folder without leading slash
      ];

      let imageFile = null;
      let foundPath = '';
      
      for (const path of possiblePaths) {
        imageFile = zip.file(path);
        if (imageFile) {
          foundPath = path;
          break;
        }
      }

      if (!imageFile) {
        log('warn', 'Image file not found in zip', { 
          referencedPath: imagePath, 
          triedPaths: possiblePaths 
        });
        continue;
      }

      const imageData = await imageFile.async('arraybuffer');
      const fileName = imagePath.split('/').pop() || imagePath;
      const storagePath = `${imageFolder}/${fileName}`;

      // Determine content type
      const ext = fileName.split('.').pop()?.toLowerCase();
      const contentType = ext === 'png' ? 'image/png' 
        : ext === 'webp' ? 'image/webp' 
        : 'image/jpeg';

      log('info', 'Uploading image', { from: foundPath, to: storagePath });

      const { error: uploadError } = await supabase.storage
        .from(MYSTERY_IMAGES_BUCKET)
        .upload(storagePath, imageData, {
          contentType,
          upsert: false,
        });

      if (uploadError) {
        log('error', 'Failed to upload image', { path: storagePath, error: uploadError });
        return NextResponse.json(
          { error: `Failed to upload image: ${fileName}`, details: uploadError.message },
          { status: 500 }
        );
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(MYSTERY_IMAGES_BUCKET)
        .getPublicUrl(storagePath);

        // Map original path to public URL
        pathMapping.set(imagePath, urlData.publicUrl);
      }

      // Update mystery data with new image paths
      if (mysteryData.image_path && pathMapping.has(mysteryData.image_path)) {
        mysteryData.image_path = pathMapping.get(mysteryData.image_path);
      } else if (mysteryData.image_path) {
        // Try with 'images/' prefix
        const withPrefix = `images/${mysteryData.image_path.replace(/^images\//, '')}`;
        if (pathMapping.has(withPrefix)) {
          mysteryData.image_path = pathMapping.get(withPrefix);
        }
      }

      for (const sheet of mysteryData.character_sheets) {
        if (sheet.image_path) {
          const originalPath = sheet.image_path;
          if (pathMapping.has(originalPath)) {
            sheet.image_path = pathMapping.get(originalPath);
          } else {
            // Try with 'images/' prefix
            const withPrefix = `images/${originalPath.replace(/^images\//, '')}`;
            if (pathMapping.has(withPrefix)) {
              sheet.image_path = pathMapping.get(withPrefix);
            }
          }
        }
      }

      log('info', 'Image paths updated', { mapping: Object.fromEntries(pathMapping) });

      // Insert mystery into database
      const { data: mystery, error: mysteryError } = await (supabase
        .from('mysteries') as any)
        .insert({
          title: mysteryData.title,
          description: mysteryData.description,
          image_path: mysteryData.image_path || null,
          language: mysteryData.language,
          author: mysteryData.author || 'Unknown',
          theme: mysteryData.theme || 'SERIOUS_MURDER',
          innocent_words: mysteryData.innocent_words,
          guilty_words: mysteryData.guilty_words,
        })
        .select()
        .single();

      if (mysteryError || !mystery) {
        log('error', 'Failed to create mystery', { error: mysteryError });
        return NextResponse.json(
          { error: 'Failed to create mystery', details: mysteryError?.message },
          { status: 500 }
        );
      }

      // Insert character sheets
      const characterSheets = mysteryData.character_sheets.map((sheet) => ({
        mystery_id: mystery.id,
        role: sheet.role,
        character_name: sheet.character_name,
        occupation: sheet.occupation || null,
        dark_secret: sheet.dark_secret,
        alibi: sheet.alibi,
        image_path: sheet.image_path || null,
      }));

      const { error: sheetsError } = await (supabase
        .from('character_sheets') as any)
        .insert(characterSheets);

      if (sheetsError) {
        log('error', 'Failed to create character sheets', { error: sheetsError });
        // Rollback: delete mystery
        await (supabase.from('mysteries') as any).delete().eq('id', mystery.id);
        return NextResponse.json(
          { error: 'Failed to create character sheets', details: sheetsError.message },
          { status: 500 }
        );
      }

      log('info', 'Mystery uploaded successfully', {
        mysteryId: mystery.id,
        title: mystery.title,
        imagesUploaded: pathMapping.size,
      });

      uploadedMysteries.push({
        id: mystery.id,
        title: mystery.title,
        imagesUploaded: pathMapping.size,
      });
    }

    log('info', 'Mystery pack upload complete', { count: uploadedMysteries.length });

    return NextResponse.json({
      success: true,
      mysteries: uploadedMysteries,
      count: uploadedMysteries.length,
    });
  } catch (error: any) {
    log('error', 'Error processing mystery pack', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to process mystery pack', details: error.message },
      { status: 500 }
    );
  }
}
