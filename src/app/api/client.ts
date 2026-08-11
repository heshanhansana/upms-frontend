const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080/api";
const REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function getDefaultErrorMessage(status: number) {
  if (status === 401) return "Authentication failed.";
  if (status === 403) return "You do not have permission to perform this action.";
  if (status === 404) return "Requested resource was not found.";
  return `Request failed with status ${status}`;
}

// ── Access token ──────────────────────────────────────────────
export function getAuthToken() {
  return window.localStorage.getItem("upms_auth_token");
}

export function setAuthToken(token: string | null) {
  if (token) {
    window.localStorage.setItem("upms_auth_token", token);
  } else {
    window.localStorage.removeItem("upms_auth_token");
  }
}

// ── Refresh token ─────────────────────────────────────────────
export function getRefreshToken() {
  return window.localStorage.getItem("upms_refresh_token");
}

export function setRefreshToken(token: string | null) {
  if (token) {
    window.localStorage.setItem("upms_refresh_token", token);
  } else {
    window.localStorage.removeItem("upms_refresh_token");
  }
}

// ── Persisted user data (used instead of a /me endpoint) ──────
export function getStoredUser<T>(): T | null {
  const raw = window.localStorage.getItem("upms_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser<T>(user: T | null) {
  if (user) {
    window.localStorage.setItem("upms_user", JSON.stringify(user));
  } else {
    window.localStorage.removeItem("upms_user");
  }
}

// ── Clear everything on logout ────────────────────────────────
export function clearAuthData() {
  window.localStorage.removeItem("upms_auth_token");
  window.localStorage.removeItem("upms_refresh_token");
  window.localStorage.removeItem("upms_user");
}

// ── Generic fetch wrapper ─────────────────────────────────────
export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  if (options.signal) {
    options.signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (controller.signal.aborted) {
      throw new ApiError("The server is taking too long to respond. Please try again shortly.", 504);
    }

    throw new ApiError(err instanceof Error ? err.message : "Unable to reach the server.", 0);
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const defaultMessage = getDefaultErrorMessage(response.status);
    let message = defaultMessage;
    try {
      const text = await response.text();
      if (text) {
        try {
          const body = JSON.parse(text);
          message = body.message ?? body.error ?? text;
        } catch {
          message = text;
        }
      } else {
        message = defaultMessage;
      }
    } catch {
      // Keep the default message when the backend returns no JSON body.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
