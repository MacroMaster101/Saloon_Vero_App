import { supabase } from '@/lib/api/supabase';

// Uploads a local image URI to a storage bucket; returns its public URL.
export async function uploadImage(bucket: string, path: string, localUri: string): Promise<{ url: string } | { error: string }> {
  const blob = await (await fetch(localUri)).blob();
  // Preserve the real image type (PNG/WebP/etc.) so it's served with the correct MIME.
  const contentType = blob.type || 'image/jpeg';
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

// Best-effort delete of a previously uploaded object (e.g. to clean up after a
// DB insert fails and leaves the image orphaned). Errors are swallowed — this is
// cleanup, not a critical path.
export async function deleteImage(bucket: string, path: string): Promise<void> {
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    // ignore — orphan cleanup is best-effort
  }
}
