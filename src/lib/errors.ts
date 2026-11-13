/**
 * Error yang aman ditampilkan ke pengguna (pesan sudah berbahasa Indonesia).
 * Route Handler memetakan `status` langsung ke HTTP status.
 */
export class AppError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.status = status;
  }
}

export const badRequest = (message: string) => new AppError(message, 400);
export const forbidden = (message = 'Anda tidak memiliki wewenang untuk melakukan aksi ini.') =>
  new AppError(message, 403);
export const notFound = (message = 'Data tidak ditemukan.') => new AppError(message, 404);
export const conflict = (message: string) => new AppError(message, 409);

