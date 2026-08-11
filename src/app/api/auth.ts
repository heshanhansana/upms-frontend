import { apiRequest } from "./client";

// ── Request shapes ────────────────────────────────────────────
export interface LoginRequest {
  username: string;
  password: string;
}

export interface MicrosoftLoginRequest {
  accessToken: string;
}

export interface RegisterRequest {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  faculty?: string;
  department?: string;
}

// ── Response shape (matches actual backend) ───────────────────
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  userId: number;
  username: string;
  email: string;
  faculty?: string;
  department?: string;
  roles: string[];
  lastLogin: string | null;
}

export interface SignupResponse {
  userId: number;
  username: string;
  email: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  message: string;
}

// ── API calls ─────────────────────────────────────────────────
export function login(payload: LoginRequest) {
  return apiRequest<AuthResponse>("/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function microsoftLogin(payload: MicrosoftLoginRequest) {
  return apiRequest<AuthResponse>("/v1/auth/microsoft", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function register(payload: RegisterRequest) {
  return apiRequest<SignupResponse>("/v1/auth/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
