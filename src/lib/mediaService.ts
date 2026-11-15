import { supabase, isSupabaseConfigured, STORAGE_BUCKET } from './supabase';
import type { MediaAsset } from '../types/database';

const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

const ALLOWED_BRAND_MIME_TYPES = [
  ...ALLOWED_IMAGE_MIME_TYPES,
  'image/svg+xml',
];

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadOptions {
  folder?: string;
  allowSvg?: boolean;
  altText?: string;
}

export function validateImageFile(
  file: File,
  allowSvg = false
): { valid: boolean; error?: string } {
  const allowedTypes = allowSvg ? ALLOWED_BRAND_MIME_TYPES : ALLOWED_IMAGE_MIME_TYPES;

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: allowSvg
        ? 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, PNG, WebP hoặc SVG.'
        : 'Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, PNG hoặc WebP (SVG chỉ dành cho Logo & Favicon).',
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Dung lượng ảnh vượt quá giới hạn 5MB. Vui lòng chọn ảnh nhẹ hơn.',
    };
  }

  return { valid: true };
}

export function getImageDimensions(
  file: File
): Promise<{ width: number | null; height: number | null }> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve({ width: null, height: null });
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      resolve({ width: img.naturalWidth || null, height: img.naturalHeight || null });
      URL.revokeObjectURL(objectUrl);
    };

    img.onerror = () => {
      resolve({ width: null, height: null });
      URL.revokeObjectURL(objectUrl);
    };

    img.src = objectUrl;
  });
}

/**
 * Resize large raster images (max 1600px) and compress to WebP for fast storefront loading.
 * Preserves SVG/transparent PNG fallback if WebP conversion is unsupported or larger.
 */
async function optimizeImageToWebP(file: File): Promise<File> {
  if (file.type === 'image/svg+xml' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1600;
      let targetW = img.naturalWidth;
      let targetH = img.naturalHeight;

      if (targetW > maxDim || targetH > maxDim) {
        const ratio = Math.min(maxDim / targetW, maxDim / targetH);
        targetW = Math.round(targetW * ratio);
        targetH = Math.round(targetH * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, targetW, targetH);
      canvas.toBlob(
        (blob) => {
          if (!blob || (blob.size >= file.size && file.type === 'image/webp')) {
            resolve(file);
            return;
          }
          const baseName = file.name.replace(/\.[^/.]+$/, '');
          const webpFile = new File([blob], `${baseName}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          resolve(webpFile);
        },
        'image/webp',
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

export async function sanitizeSvgFile(file: File): Promise<{ safe: boolean; error?: string }> {
  if (file.type !== 'image/svg+xml') return { safe: true };
  try {
    const text = await file.text();
    const lower = text.toLowerCase();
    if (
      lower.includes('<script') ||
      lower.includes('javascript:') ||
      lower.includes('onload=') ||
      lower.includes('onerror=')
    ) {
      return {
        safe: false,
        error: 'File SVG chứa mã kịch bản không an toàn và đã bị từ chối.',
      };
    }
    return { safe: true };
  } catch {
    return { safe: false, error: 'Không thể kiểm tra độ an toàn của file SVG.' };
  }
}

export async function uploadMediaFile(
  file: File,
  options: UploadOptions = {}
): Promise<{ asset: MediaAsset | null; error: string | null }> {
  const { folder = 'general', allowSvg = false, altText = '' } = options;

  const validation = validateImageFile(file, allowSvg);
  if (!validation.valid) {
    return { asset: null, error: validation.error || 'File không hợp lệ' };
  }

  if (file.type === 'image/svg+xml') {
    const svgCheck = await sanitizeSvgFile(file);
    if (!svgCheck.safe) {
      return { asset: null, error: svgCheck.error || 'File SVG không an toàn' };
    }
  }

  if (!isSupabaseConfigured) {
    return {
      asset: null,
      error:
        'Chưa kết nối Supabase Storage (Thiếu VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY). Vui lòng cấu hình Supabase để tải ảnh lên đám mây.',
    };
  }

  const processedFile = await optimizeImageToWebP(file);
  const dimensions = await getImageDimensions(processedFile);
  const ext = processedFile.name.split('.').pop()?.toLowerCase() || 'webp';
  const cleanBaseName = processedFile.name
    .replace(/\.[^/.]+$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .slice(0, 48);

  const uniquePath = `${folder}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 7)}-${cleanBaseName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(uniquePath, processedFile, {
      cacheControl: '31536000',
      upsert: false,
      contentType: processedFile.type,
    });

  if (uploadError) {
    return {
      asset: null,
      error: `Lỗi tải ảnh lên Supabase Storage: ${uploadError.message}`,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(uniquePath);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: inserted, error: dbError } = await supabase
    .from('media_assets')
    .insert({
      file_name: processedFile.name,
      file_path: uniquePath,
      public_url: publicUrl,
      mime_type: processedFile.type,
      file_size: processedFile.size,
      width: dimensions.width,
      height: dimensions.height,
      alt_text: altText || processedFile.name,
      folder,
      uploaded_by: user?.id || null,
    })
    .select('*')
    .single();

  if (dbError) {
    return {
      asset: null,
      error: `Ảnh đã tải lên nhưng không thể lưu metadata: ${dbError.message}`,
    };
  }

  return { asset: inserted as MediaAsset, error: null };
}

export async function deleteMediaAsset(
  asset: MediaAsset
): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Chưa kết nối Supabase Storage.' };
  }

  const { error: storageErr } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([asset.file_path]);

  if (storageErr) {
    console.warn('Storage remove warning:', storageErr.message);
  }

  const { error: dbErr } = await supabase
    .from('media_assets')
    .delete()
    .eq('id', asset.id);

  if (dbErr) {
    return { error: dbErr.message };
  }

  return { error: null };
}
