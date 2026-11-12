/** Helper fetch untuk komponen client. Melempar Error dengan pesan dari server. */
export async function apiFetch<T = Record<string, unknown>>(
  url: string,
  init?: { method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'; body?: unknown }
): Promise<T> {
  const hasBody = init?.body !== undefined;
  const res = await fetch(url, {
    method: init?.method ?? 'GET',
    headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
    body: hasBody ? JSON.stringify(init?.body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) {
    throw new Error(data.error || 'Permintaan gagal. Coba lagi.');
  }
  return data as T;
}

/** Petakan ZodError ke { namaField: pesanPertama } untuk ditampilkan di form. */
export function zodFieldErrors(error: { issues: Array<{ path: PropertyKey[]; message: string }> }): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

