/**
 * Referensi gambar yang diizinkan:
 *  1. URL gambar database terunggah: /api/images/<id>
 *  2. File lokal di folder public/gambar/, ditulis /gambar/<subfolder>/<nama>.<ext>
 *  3. URL eksternal http(s), mis. https://...
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
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

export const IMAGE_REF_ERROR =
  'Gunakan tombol unggah foto, URL gambar (https://...), atau path lokal /gambar/...';

