import { apiFetch, clearAuth } from "./client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  city: string;
  theme: string;
  default_route_preference: string;
  use_everyday: boolean;
  commute_destination?: string | null;
  commute_destination_coords?: string | null;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
  confirm_password: string;
  use_everyday?: boolean;
  commute_destination?: string | null;
  commute_destination_coords?: string | null;
}): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logoutUser(): Promise<void> {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // Server-side logout is best-effort; always clear client state
  } finally {
    clearAuth();
  }
}

/** Persist auth data returned by login/register */
export function persistAuth(data: AuthResponse) {
  localStorage.setItem("nt:auth", "1");
  localStorage.setItem("nt:auth_token", data.token);
  localStorage.setItem("nt:user", JSON.stringify(data.user));
}

/** Read the cached user from localStorage (set at login time) */
export function getCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("nt:user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
