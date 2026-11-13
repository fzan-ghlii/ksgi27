/**
 * Referensi gambar yang diizinkan:
 *  1. URL gambar database terunggah: /api/images/<id>
 *  2. File lokal di folder public/gambar/, ditulis /gambar/<subfolder>/<nama>.<ext>
 *  3. URL eksternal terenkripsi https://... (http:// lokal hanya saat development/test)
 */
const LOCAL_IMAGE = /^\/gambar\/[A-Za-z0-9_\-./]+\.(?:jpe?g|png|webp|gif|avif)$/i;
const DATABASE_IMAGE = /^\/api\/images\/[A-Za-z0-9_\-]+$/i;

export function isValidImageRef(value: string): boolean {
  const v = value.trim();
  if (!v) return false;

  if (v.startsWith('/api/images/')) {
    return DATABASE_IMAGE.test(v);
  }

  if (v.startsWith('/gambar/')) {
    return LOCAL_IMAGE.test(v) && !v.includes('..') && !v.includes('//');
  }

  try {
    const u = new URL(v);
    if (u.protocol === 'https:') {
      return true;
    }
    if (
      process.env.NODE_ENV !== 'production' &&
      u.protocol === 'http:' &&
      (u.hostname === 'localhost' || u.hostname === '127.0.0.1')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export const IMAGE_REF_ERROR =
  'Gunakan tombol unggah foto, URL gambar aman (https://...), atau path lokal /gambar/...';

