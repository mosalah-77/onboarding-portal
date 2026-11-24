export class ApiError extends Error {
  status: number; details: { field: string; message: string }[];
  constructor(status: number, message: string, details: unknown = []) {
    super(message); this.status = status;
    this.details = Array.isArray(details) ? details.filter(x => typeof x?.field === 'string' && typeof x?.message === 'string') : [];
  }
}
export async function requestPortal<T>(path: string, csrf = '', body?: Record<string, unknown>, file?: File): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/portal${path}`, { method: body === undefined ? 'GET' : 'POST', cache: 'no-store',
      headers: { 'X-Portal-Request': '1', 'X-CSRF-Token': csrf,
        ...(file ? { 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name), 'X-Operation-Key': String(body?.key) } : { 'Content-Type': 'application/json' }) },
      body: file ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
  } catch { throw new ApiError(0, 'The connection failed. Your input is still here. Retry the same action to check whether it saved.'); }
  const data = await response.json().catch(() => null);
  const record = data && typeof data === 'object' ? data as Record<string, unknown> : {};
  if (!response.ok) throw new ApiError(response.status, typeof record.error === 'string' ? record.error : 'The action could not be completed. Retry shortly.', record.details);
  if (!data) throw new ApiError(503, 'The response could not be read. Retry the same action.');
  return data as T;
}
