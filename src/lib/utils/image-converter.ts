/**
 * Utility untuk validasi dan konversi otomatis gambar ke WebP di sisi browser (client-side).
 * Mendukung input format PNG dan JPG/JPEG dengan batas maksimal ukuran 1 MB.
 */

export interface ConvertedImageResult {
  file: File;
  base64: string;
  originalSize: number;
  webpSize: number;
  width: number;
  height: number;
}

export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB dalam bytes

export async function convertImageToWebP(
  file: File,
  options?: {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number;
  }
): Promise<ConvertedImageResult> {
  const maxWidth = options?.maxWidth ?? 1600;
  const maxHeight = options?.maxHeight ?? 1600;
  const quality = options?.quality ?? 0.82;

  // 1. Validasi Ukuran File (Maksimal 1 MB)
  if (file.size > MAX_FILE_SIZE) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    throw new Error(`Ukuran berkas melebihi batas 1 MB (file Anda: ${sizeMb} MB). Harap pilih berkas maksimal 1 MB.`);
  }

  // 2. Validasi Format (PNG atau JPG/JPEG)
  const isJpgOrPng =
    file.type === 'image/jpeg' ||
    file.type === 'image/png' ||
    file.type === 'image/jpg' ||
    /\.(jpe?g|png)$/i.test(file.name);

  if (!isJpgOrPng) {
    throw new Error('Format berkas harus berupa PNG atau JPG/JPEG.');
  }

  // 3. Konversi ke WebP menggunakan HTML Canvas
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proporsional jika melebihi dimensi batas maksimum
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context tidak tersedia pada peramban ini.'));
          return;
        }

        // Gambar ke canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Gagal mengonversi gambar ke format WebP.'));
              return;
            }

            const cleanBaseName = file.name.replace(/\.[^/.]+$/, '').toLowerCase().replace(/[^a-z0-9_-]/g, '-');
            const webpFileName = `${cleanBaseName || 'image'}.webp`;

            const webpFile = new File([blob], webpFileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            // Baca base64 untuk pengiriman API
            const base64Reader = new FileReader();
            base64Reader.onloadend = () => {
              const fullDataUrl = base64Reader.result as string;
              // Pisahkan header data URI jika perlu
              const base64Data = fullDataUrl.includes(',') ? fullDataUrl.split(',')[1] : fullDataUrl;

              resolve({
                file: webpFile,
                base64: base64Data,
                originalSize: file.size,
                webpSize: blob.size,
                width,
                height,
              });
            };
            base64Reader.onerror = () => reject(new Error('Gagal membaca data WebP.'));
            base64Reader.readAsDataURL(blob);
          },
          'image/webp',
          quality
        );
      };

      img.onerror = () => reject(new Error('Gagal memuat elemen gambar untuk konversi.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar asli.'));
    reader.readAsDataURL(file);
  });
}

