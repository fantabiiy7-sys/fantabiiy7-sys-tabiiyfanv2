import * as tus from 'tus-js-client';
import { supabase, STORAGE_BUCKET, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { fileExt } from './utils';

const RESUMABLE_THRESHOLD = 6 * 1024 * 1024; // 6 MB dan katta fayllar bo'laklab yuklanadi

function makePath(folder, file) {
  const ext = fileExt(file.name);
  const id = crypto.randomUUID();
  return `${folder}/${id}${ext ? '.' + ext : ''}`;
}

/**
 * Faylni Supabase Storage'ga yuklaydi.
 * Katta fayllar (video va h.k.) TUS protokoli orqali bo'laklab, uzilishga chidamli tarzda yuklanadi.
 * @returns {Promise<{path:string,name:string,size:number,mime:string}>}
 */
export async function uploadFile(file, folder, onProgress) {
  if (!supabase) throw new Error('Supabase is not configured');
  const path = makePath(folder, file);
  const contentType = file.type || 'application/octet-stream';

  if (file.size <= RESUMABLE_THRESHOLD) {
    onProgress?.(10);
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType, upsert: false, cacheControl: '3600' });
    if (error) throw error;
    onProgress?.(100);
  } else {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Not authenticated');
    await new Promise((resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint: `${SUPABASE_URL}/storage/v1/upload/resumable`,
        retryDelays: [0, 3000, 5000, 10000, 20000],
        headers: { authorization: `Bearer ${token}`, apikey: SUPABASE_ANON_KEY, 'x-upsert': 'false' },
        uploadDataDuringCreation: true,
        removeFingerprintOnSuccess: true,
        metadata: { bucketName: STORAGE_BUCKET, objectName: path, contentType, cacheControl: '3600' },
        chunkSize: 6 * 1024 * 1024, // Supabase talabi: aynan 6 MB
        onError: reject,
        onProgress: (sent, total) => onProgress?.(Math.round((sent / total) * 100)),
        onSuccess: resolve,
      });
      upload.findPreviousUploads().then((prev) => {
        if (prev.length) upload.resumeFromPreviousUpload(prev[0]);
        upload.start();
      });
    });
  }
  return { path, name: file.name, size: file.size, mime: contentType };
}

export async function removeFiles(paths) {
  const list = paths.filter(Boolean);
  if (!list.length || !supabase) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(list);
}
