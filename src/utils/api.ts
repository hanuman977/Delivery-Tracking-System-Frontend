const envRecord = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
export const API_BASE_URL = envRecord.VITE_API_BASE_URL ?? '';

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('access_token');
  if (token) {
    return { 'Authorization': `Bearer ${token}` };
  }
  return {};
}

export async function get<T>(path: string, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL + path;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    ...(init || {}),
  });

  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // Non-JSON response; leave json undefined
  }

  if (!res.ok) {
    const message = (json as { message?: string; error?: string } | undefined)?.message ||
      (json as { message?: string; error?: string } | undefined)?.error ||
      res.statusText;
    const err: ApiError = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json as T;
}

export async function post<T>(path: string, body: unknown, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    body: JSON.stringify(body ?? {}),
    ...init,
  });

  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // Non-JSON response; leave json undefined
  }

  if (!res.ok) {
    const message = (json as { message?: string; error?: string } | undefined)?.message ||
      (json as { message?: string; error?: string } | undefined)?.error ||
      res.statusText;
    const err: ApiError = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json as T;
}

export async function put<T>(path: string, body?: unknown, init?: RequestInit): Promise<T> {
  const url = API_BASE_URL + path;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...(init?.headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    ...init,
  });

  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // Non-JSON response; leave json undefined
  }

  if (!res.ok) {
    const message = (json as { message?: string; error?: string } | undefined)?.message ||
      (json as { message?: string; error?: string } | undefined)?.error ||
      res.statusText;
    const err: ApiError = new Error(message);
    err.status = res.status;
    err.data = json;
    throw err;
  }

  return json as T;
}
