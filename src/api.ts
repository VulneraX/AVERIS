export interface ApiErrorBody {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fields = body.fields;
  }
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      credentials: 'include',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
    });
  } catch {
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.',
    });
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;
  if (!response.ok) {
    const error = body?.error ?? { code: 'REQUEST_FAILED', message: 'Permintaan tidak berhasil.' };
    if (response.status === 401 && !path.endsWith('/auth/login')) {
      window.dispatchEvent(new CustomEvent('averis:unauthorized'));
    }
    throw new ApiError(response.status, error);
  }
  return body as T;
}

export async function downloadFromApi(path: string): Promise<void> {
  let response: Response;
  try { response = await fetch(path, { credentials: 'include' }); }
  catch { throw new ApiError(0, { code: 'NETWORK_ERROR', message: 'Tidak dapat terhubung ke server.' }); }
  if (!response.ok) {
    const body = response.headers.get('content-type')?.includes('application/json') ? await response.json() : null;
    throw new ApiError(response.status, body?.error ?? { code: 'DOWNLOAD_FAILED', message: 'File tidak dapat dibuat.' });
  }
  const blob = await response.blob();
  const disposition = response.headers.get('content-disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || 'averis-export';
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove();
  URL.revokeObjectURL(url);
}
