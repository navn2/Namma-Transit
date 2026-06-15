/**
 * Namma Transit API client
 * All requests go through the Vite dev-proxy (/api → http://127.0.0.1:8000).
 * In production, /api should be served by the backend directly or a reverse proxy.
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

function getToken(): string | null {
  return localStorage.getItem("nt:auth_token");
}

function isDemo(): boolean {
  return localStorage.getItem("nt:auth") === "demo";
}

export function clearAuth() {
  localStorage.removeItem("nt:auth");
  localStorage.removeItem("nt:auth_token");
  localStorage.removeItem("nt:user");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    clearAuth();
    if (typeof window !== "undefined") {
      console.warn("API returned 401 — redirecting to home");
      window.location.href = "/map";
    }
    throw new ApiError(401, "Session expired. Redirecting to home.");
  }

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      detail = body?.detail ?? detail;
    } catch {
      // ignore parse errors
    }
    throw new ApiError(res.status, detail);
  }

  return res.json() as Promise<T>;
}

/** Returns true when running in demo/offline mode (no real backend token) */
export { isDemo };
