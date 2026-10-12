const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

type Params = Record<string, string | undefined>;

export class ApiError extends Error {
  response: { status: number; data: { message?: string } };
  constructor(status: number, data: { message?: string }) {
    super(data?.message || `Request failed with status ${status}`);
    this.response = { status, data };
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  params?: Params
): Promise<{ data: T }> {
  const query = new URLSearchParams(
    Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
  ).toString();

  const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}${path}${query ? `?${query}` : ''}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : {};

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    throw new ApiError(res.status, data);
  }
  return { data };
}

const api = {
  get: <T>(path: string, config?: { params?: Params }) =>
    request<T>('GET', path, undefined, config?.params),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  delete: <T>(path: string) => request<T>('DELETE', path)
};

export default api;
