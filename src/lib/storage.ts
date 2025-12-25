/**
 * Storage configuration and helpers for mystery images
 */

export const MYSTERY_IMAGES_BUCKET = 'mystery-images';

/**
 * Get the public URL for a mystery image stored in Supabase Storage
 * @param storagePath - The path within the mystery-images bucket (e.g., "my-mystery-123/cover.jpg")
 * @returns Full public URL to the image
 */
export function getMysteryImageUrl(storagePath: string | null | undefined): string | null {
  if (!storagePath) return null;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) {
    console.warn('NEXT_PUBLIC_SUPABASE_URL not configured');
    return null;
  }
  
  return `${supabaseUrl}/storage/v1/object/public/${MYSTERY_IMAGES_BUCKET}/${storagePath}`;
}

/**
 * Get the storage path from a full public URL
 * @param url - Full public URL
 * @returns Storage path or null if not a valid mystery image URL
 */
export function getStoragePathFromUrl(url: string): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !url.startsWith(supabaseUrl)) return null;
  
  const prefix = `${supabaseUrl}/storage/v1/object/public/${MYSTERY_IMAGES_BUCKET}/`;
  if (!url.startsWith(prefix)) return null;
  
  return url.slice(prefix.length);
}
