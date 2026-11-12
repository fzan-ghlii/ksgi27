import { describe, it, expect } from 'vitest';
import { slugify, readingMinutes, markdownExcerpt } from './content';
import { isValidImageRef } from './image-ref';

describe('slugify', () => {
  it('mengubah judul menjadi slug bersih', () => {
    expect(slugify('Memahami Saham & Obligasi: Panduan Pemula!')).toBe(
      'memahami-saham-dan-obligasi-panduan-pemula'
    );
    expect(slugify('  Café Ékonomi 2026  ')).toBe('cafe-ekonomi-2026');
  });
  it('fallback bila kosong dan tidak berakhir tanda hubung', () => {
    expect(slugify('!!!')).toBe('artikel');
    expect(slugify('a'.repeat(79) + ' bbb', 80).endsWith('-')).toBe(false);
  });
});

describe('readingMinutes & excerpt', () => {
  it('minimal 1 menit dan membulat ke atas', () => {
    expect(readingMinutes('halo dunia')).toBe(1);
    expect(readingMinutes(Array(401).fill('kata').join(' '))).toBe(3);
  });
  it('excerpt membuang sintaks markdown dan memotong', () => {
    expect(markdownExcerpt('## Judul\n**tebal** [tautan](https://x.id)')).toBe('Judul tebal tautan');
    expect(markdownExcerpt('a'.repeat(300), 50).length).toBeLessThanOrEqual(51);
  });
});

describe('isValidImageRef', () => {
  it('menerima URL http(s) dan path lokal /gambar', () => {
    expect(isValidImageRef('https://i.imgur.com/abc.jpg')).toBe(true);
    expect(isValidImageRef('https://images.unsplash.com/photo-1?w=600')).toBe(true);
    expect(isValidImageRef('/gambar/artikel/saham-1.webp')).toBe(true);
  });
  it('menolak skema berbahaya, path traversal, dan ekstensi aneh', () => {
    expect(isValidImageRef('javascript:alert(1)')).toBe(false);
    expect(isValidImageRef('data:image/png;base64,AAA')).toBe(false);
    expect(isValidImageRef('/gambar/../.env')).toBe(false);
    expect(isValidImageRef('/gambar/artikel/file.exe')).toBe(false);
    expect(isValidImageRef('/lain/foto.jpg')).toBe(false);
    expect(isValidImageRef('')).toBe(false);
  });
});

