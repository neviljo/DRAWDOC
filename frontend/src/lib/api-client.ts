const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    public body: any
  ) {
    super(body?.detail || body?.message || `API error ${status}`);
  }
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function getAuthToken(): string | null {
  return sessionStorage.getItem("access_token");
}

function setAuthToken(token: string) {
  sessionStorage.setItem("access_token", token);
}

export const apiClient = {
  get: <T>(path: string) => api<T>(path),
  post: <T>(path: string, data?: unknown) =>
    api<T>(path, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(path: string, data: unknown) => api<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) => api<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => api<T>(path, { method: "DELETE" }),
};

export { ApiError, setAuthToken };
