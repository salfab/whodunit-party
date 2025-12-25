import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { createLogger } from '@/lib/logging';

const log = createLogger('api.upload.signed-urls');

const MYSTERY_IMAGES_BUCKET = 'mystery-images';
const SIGNED_URL_EXPIRY = 60 * 5; // 5 minutes

interface SignedUrlRequest {
  files: Array<{
    filename: string;
    contentType: string;
  }>;
  mysterySlug: string;
}

/**
 * POST /api/upload/signed-urls
 * Get pre-signed URLs for uploading mystery images directly to Supabase Storage
 * 
 * Request body:
 * {
 *   "mysterySlug": "my-mystery-title",
 *   "files": [
 *     { "filename": "cover.jpg", "contentType": "image/jpeg" },
 *     { "filename": "character1.jpg", "contentType": "image/jpeg" }
 *   ]
 * }
 * 
 * Response:
 * {
 *   "uploadUrls": [
 *     { "filename": "cover.jpg", "uploadUrl": "...", "storagePath": "my-mystery-123/cover.jpg" }
 *   ],
 *   "folder": "my-mystery-123"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    log('info', 'Signed URLs request received');

    const body: SignedUrlRequest = await request.json();
    const { files, mysterySlug } = body;

    if (!files || !Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { error: 'No files specified', details: 'Request must include a files array' },
        { status: 400 }
      );
    }

    if (!mysterySlug || typeof mysterySlug !== 'string') {
      return NextResponse.json(
        { error: 'Missing mysterySlug', details: 'Request must include a mysterySlug' },
        { status: 400 }
      );
    }

    // Validate file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    for (const file of files) {
      if (!allowedTypes.includes(file.contentType)) {
        return NextResponse.json(
          { error: `Invalid content type: ${file.contentType}`, details: `Allowed types: ${allowedTypes.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Generate unique folder
    const sanitizedSlug = mysterySlug
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);
    const timestamp = Date.now();
    const folder = `${sanitizedSlug}-${timestamp}`;

    const supabase = await createServiceClient();
    const uploadUrls: Array<{
      filename: string;
      uploadUrl: string;
      storagePath: string;
    }> = [];

    for (const file of files) {
      const storagePath = `${folder}/${file.filename}`;

      const { data, error } = await supabase.storage
        .from(MYSTERY_IMAGES_BUCKET)
        .createSignedUploadUrl(storagePath);

      if (error || !data) {
        log('error', 'Failed to create signed URL', { filename: file.filename, error });
        return NextResponse.json(
          { error: `Failed to create signed URL for ${file.filename}`, details: error?.message },
          { status: 500 }
        );
      }

      uploadUrls.push({
        filename: file.filename,
        uploadUrl: data.signedUrl,
        storagePath,
      });
    }

    log('info', 'Signed URLs created', { count: uploadUrls.length, folder });

    return NextResponse.json({
      success: true,
      folder,
      uploadUrls,
      expiresIn: SIGNED_URL_EXPIRY,
    });
  } catch (error: any) {
    log('error', 'Error creating signed URLs', { error: error.message });
    return NextResponse.json(
      { error: 'Failed to create signed URLs', details: error.message },
      { status: 500 }
    );
  }
}
