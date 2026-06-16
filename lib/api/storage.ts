import { supabase } from '@/lib/api/supabase';

// Read a (possibly file://) URI into an ArrayBuffer via FileReader. On React
// Native, supabase-js's upload of a Blob from fetch() frequently lands a 0-byte
// object in Storage — the request "succeeds" but the image is empty/broken.
// Going through FileReader.readAsArrayBuffer gives the real bytes, which
// supabase-js uploads reliably across iOS and Android.
async function uriToArrayBuffer(localUri: string): Promise<{ data: ArrayBuffer; type: string }> {
  const blob = await (await fetch(localUri)).blob();
  const type = blob.type || 'image/jpeg';
  const data = await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('Could not read image.'));
    reader.readAsArrayBuffer(blob);
  });
  return { data, type };
}

// Uploads a local image URI to a storage bucket; returns its public URL.
export async function uploadImage(bucket: string, path: string, localUri: string): Promise<{ url: string } | { error: string }> {
  try {
    const { data: bytes, type } = await uriToArrayBuffer(localUri);
    if (bytes.byteLength === 0) return { error: 'Selected image is empty.' };
    const { error } = await supabase.storage.from(bucket).upload(path, bytes, { upsert: true, contentType: type });
    if (error) return { error: error.message };
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl };
  } catch (e: any) {
    return { error: e?.message ?? 'Upload failed.' };
  }
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
