import { supabase } from '@/lib/api/supabase';

// Uploads a local image URI to a storage bucket; returns its public URL.
export async function uploadImage(bucket: string, path: string, localUri: string): Promise<{ url: string } | { error: string }> {
  const blob = await (await fetch(localUri)).blob();
  const { error } = await supabase.storage.from(bucket).upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) return { error: error.message };
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
