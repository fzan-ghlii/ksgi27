import { google } from 'googleapis';

export interface ParticipantRow {
  registered_at: string;
  full_name: string;
  nim: string;
  email: string;
  whatsapp: string;
  institution: string;
  has_rdn: boolean;
  attendance_status: string;
  notes?: string;
}

export interface SheetAppendResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
  updatedRows?: number;
}

/**
 * Mengecek apakah kredensial Service Account Google Sheets tersedia di environment variables.
 */
function isGoogleSheetsConfigured(): boolean {
  const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  return !!(clientEmail && clientEmail.trim() !== '' && privateKey && privateKey.trim() !== '');
}

let cachedSheets: { credsKey: string; client: ReturnType<typeof google.sheets> } | null = null;
const checkedHeaderTabs = new Set<string>();

/** Bentuk array 10 kolom standar untuk satu baris peserta di Google Sheet. */
export function toSheetRow(registrationId: string, participant: ParticipantRow): string[] {
  return [
    participant.registered_at,
    participant.full_name,
    participant.nim,
    participant.email,
    participant.whatsapp,
    participant.institution,
    participant.has_rdn ? 'Sudah Ada' : 'Belum Ada',
    participant.attendance_status || 'Registered',
    participant.notes || '-',
    registrationId,
  ];
}

/**
 * Mendapatkan client Sheets API v4 yang terautentikasi (di-cache per kredensial).
 * Mengembalikan null jika kredensial tidak lengkap / tidak valid.
 */
function getGoogleSheetsClient() {
  if (!isGoogleSheetsConfigured()) {
    return null;
  }

  try {
    const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL!.trim();
    let privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!;

    // Normalisasi newline jika tersimpan sebagai string literal "\n"
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const credsKey = `${clientEmail}::${privateKey}`;
    if (cachedSheets?.credsKey === credsKey) {
      return cachedSheets.client;
    }

    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const client = google.sheets({ version: 'v4', auth });
    cachedSheets = { credsKey, client };
    return client;
  } catch (err) {
    console.warn('[GoogleSheets] Gagal inisialisasi client JWT:', err);
    return null;
  }
}

/**
 * Memastikan baris Header kolom tersedia di tab Google Sheet jika masih kosong.
 */
async function ensureSheetHeader(
  sheets: ReturnType<typeof google.sheets>,
  spreadsheetId: string,
  tabName: string
) {
  const cacheKey = `${spreadsheetId}::${tabName}`;
  if (checkedHeaderTabs.has(cacheKey)) return;

  try {
    const checkRange = `${tabName}!A1:J1`;
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: checkRange,
    });

    if (!res.data.values || res.data.values.length === 0) {
      // Tulis header standar
      const headers = [
        'Timestamp Pendaftaran',
        'Nama Lengkap',
        'NIM / Identitas',
        'Email',
        'Nomor WhatsApp',
        'Fakultas / Instansi',
        'Punya RDN',
        'Status Kehadiran',
        'Catatan',
        'ID Registrasi GIBEI',
      ];
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tabName}!A1:J1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [headers] },
      });
    }
    checkedHeaderTabs.add(cacheKey);
  } catch (err) {
    console.warn(`[GoogleSheets] Warning saat cek/tulis header di ${tabName}:`, err);
  }
}

/**
 * Menambahkan satu baris pendaftar baru ke Google Spreadsheet secara real-time.
 */
export async function appendParticipantToSheet(params: {
  spreadsheetId: string;
  sheetTabName?: string;
  registrationId: string;
  participant: ParticipantRow;
}): Promise<SheetAppendResult> {
  const { spreadsheetId, sheetTabName = 'Pendaftar', registrationId, participant } = params;

  if (!spreadsheetId || spreadsheetId.trim() === '') {
    return { success: false, skipped: true, error: 'Spreadsheet ID belum diatur pada kegiatan ini.' };
  }

  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    return {
      success: false,
      skipped: true,
      error: 'Google Sheets Service Account belum dikonfigurasi di server (.env).',
    };
  }

  try {
    await ensureSheetHeader(sheets, spreadsheetId, sheetTabName);

    const row = toSheetRow(registrationId, participant);

    const range = `${sheetTabName}!A:J`;
    const res = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [row],
      },
    });

    const updated = res.data.updates?.updatedRows ?? 1;
    return { success: true, updatedRows: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[GoogleSheets] Gagal append row ke spreadsheet ${spreadsheetId}:`, message);
    return { success: false, error: message };
  }
}

/**
 * Memperbarui status kehadiran peserta di Google Spreadsheet.
 */
export async function updateAttendanceInSheet(params: {
  spreadsheetId: string;
  sheetTabName?: string;
  registrationId: string;
  attendanceStatus: string;
}): Promise<SheetAppendResult> {
  const { spreadsheetId, sheetTabName = 'Pendaftar', registrationId, attendanceStatus } = params;

  if (!spreadsheetId || spreadsheetId.trim() === '') {
    return { success: false, skipped: true, error: 'Spreadsheet ID tidak ada.' };
  }

  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    return { success: false, skipped: true, error: 'Google Sheets credentials belum dikonfigurasi.' };
  }

  try {
    // Ambil kolom J (ID Registrasi GIBEI) untuk mencari nomor baris
    const range = `${sheetTabName}!J:J`;
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    const rows = res.data.values || [];

    let targetRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i] && rows[i][0] === registrationId) {
        targetRowIndex = i + 1; // 1-based index
        break;
      }
    }

    if (targetRowIndex === -1) {
      return { success: false, error: `ID registrasi ${registrationId} tidak ditemukan di Google Sheet.` };
    }

    // Kolom H adalah Status Kehadiran (A:1, B:2, C:3, D:4, E:5, F:6, G:7, H:8, I:9, J:10)
    const updateRange = `${sheetTabName}!H${targetRowIndex}`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: updateRange,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[attendanceStatus]],
      },
    });

    return { success: true, updatedRows: 1 };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

/**
 * Sinkronisasi batch peserta yang belum tersinkronisasi.
 */
export async function batchSyncParticipantsToSheet(params: {
  spreadsheetId: string;
  sheetTabName?: string;
  participants: Array<{ registrationId: string; data: ParticipantRow }>;
}): Promise<{ syncedCount: number; failedIds: string[]; error?: string }> {
  const { spreadsheetId, sheetTabName = 'Pendaftar', participants } = params;

  if (participants.length === 0) {
    return { syncedCount: 0, failedIds: [] };
  }

  if (!spreadsheetId || spreadsheetId.trim() === '') {
    return { syncedCount: 0, failedIds: participants.map((p) => p.registrationId), error: 'Spreadsheet ID belum diatur.' };
  }

  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    return {
      syncedCount: 0,
      failedIds: participants.map((p) => p.registrationId),
      error: 'Google Sheets Service Account belum dikonfigurasi.',
    };
  }

  try {
    await ensureSheetHeader(sheets, spreadsheetId, sheetTabName);

    // Dapatkan data registrasi yang sudah ada di sheet agar tidak duplikat
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${sheetTabName}!J:J`,
    });
    const existingIds = new Set(
      (res.data.values || []).map((row) => (row[0] ? String(row[0]).trim() : ''))
    );

    const rowsToAppend: string[][] = [];
    const appendedIds: string[] = [];

    for (const p of participants) {
      if (!existingIds.has(p.registrationId)) {
        rowsToAppend.push(toSheetRow(p.registrationId, p.data));
        appendedIds.push(p.registrationId);
      } else {
        // Anggap sudah sync
        appendedIds.push(p.registrationId);
      }
    }

    if (rowsToAppend.length > 0) {
      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${sheetTabName}!A:J`,
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: rowsToAppend },
      });
    }

    return { syncedCount: appendedIds.length, failedIds: [] };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      syncedCount: 0,
      failedIds: participants.map((p) => p.registrationId),
      error: message,
    };
  }
}

/**
 * Uji koneksi Google Sheets untuk Console Creator.
 */
export async function testGoogleSheetsConnection(testSpreadsheetId?: string) {
  if (!isGoogleSheetsConfigured()) {
    return {
      configured: false,
      connected: false,
      message: 'Kredensial Service Account belum disetel (cek GOOGLE_SHEETS_CLIENT_EMAIL dan GOOGLE_SHEETS_PRIVATE_KEY).',
    };
  }

  const sheets = getGoogleSheetsClient();
  if (!sheets) {
    return {
      configured: true,
      connected: false,
      message: 'Format kunci privat atau email service account tidak valid.',
    };
  }

  if (!testSpreadsheetId) {
    return {
      configured: true,
      connected: true,
      message: 'Service Account terautentikasi dengan benar. Siap digunakan.',
    };
  }

  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: testSpreadsheetId });
    return {
      configured: true,
      connected: true,
      sheetTitle: res.data.properties?.title,
      message: `Berhasil terhubung ke spreadsheet "${res.data.properties?.title}".`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      configured: true,
      connected: false,
      message: `Gagal mengakses spreadsheet: ${message}. Pastikan spreadsheet dibagikan ke ${process.env.GOOGLE_SHEETS_CLIENT_EMAIL} sebagai Editor.`,
    };
  }
}

