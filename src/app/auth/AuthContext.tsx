import { createContext, useContext, useMemo, useState } from "react";
import type { Role, UserContext } from "../dashboard/types";
import { ROLE_META } from "../dashboard/types";
import * as authApi from "../api/auth";
import {
  setAuthToken,
  setRefreshToken,
  clearAuthData,
  getAuthToken,
  getStoredUser,
  setStoredUser,
} from "../api/client";

// ── Map backend role strings → frontend Role codes ────────────
const BACKEND_TO_FRONTEND_ROLE: Record<string, Role> = {
  HOD: "HOD",
  BURSAR: "BUR",
  FACULTY_BURSAR: "FBUR",
  FACULTY_DEAN: "FBUR",
  SUPPLIER_DIVISION_CLERK: "SDC",
  TEC_MEMBER: "TEC",
  TENDER_BOARD_MEMBER: "TB",
  STORE_KEEPER: "STK",
  BIDDER: "SUP",
  FINANCE_DIVISION: "FIN",
  PROCUREMENT_OFFICER: "SDC",
  EVALUATOR: "TEC",
  ADMIN: "ADM",
};

function mapBackendRole(backendRole: string): Role {
  return BACKEND_TO_FRONTEND_ROLE[backendRole] ?? "HOD";
}

function buildUserContext(res: authApi.AuthResponse): UserContext {
  const primaryBackendRole = res.roles[0] ?? "HOD";
  const role = mapBackendRole(primaryBackendRole);
  const meta = ROLE_META[role];

  return {
    role,
    name: res.username,
    title: meta.label,
    faculty: res.faculty,
    department: res.department,
    avatarInitials: res.username.slice(0, 2).toUpperCase(),
  };
}

// ── Context types ─────────────────────────────────────────────
interface AuthContextValue {
  user: UserContext | null;
  authToken: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserContext>;
  loginWithMicrosoftToken: (accessToken: string) => Promise<UserContext>;
  register: (payload: authApi.RegisterRequest) => Promise<void>;
  logout: () => void;
  setDemoUser: (user: UserContext) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authToken, setAuthTokenState] = useState<string | null>(() => getAuthToken());
  const [user, setUser] = useState<UserContext | null>(() => {
    if (!authToken) {
      clearAuthData();
      return null;
    }

    return getStoredUser<UserContext>();
  });
  const [isLoading] = useState(false);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    authToken,
    isLoading,
    async login(username, password) {
      const response = await authApi.login({ username, password });
      // Persist tokens
      setAuthToken(response.accessToken);
      setAuthTokenState(response.accessToken);
      setRefreshToken(response.refreshToken);
      // Build & persist user context
      const userCtx = buildUserContext(response);
      setStoredUser(userCtx);
      setUser(userCtx);
      return userCtx;
    },
    async loginWithMicrosoftToken(accessToken) {
      const response = await authApi.microsoftLogin({ accessToken });
      setAuthToken(response.accessToken);
      setAuthTokenState(response.accessToken);
      setRefreshToken(response.refreshToken);
      const userCtx = buildUserContext(response);
      setStoredUser(userCtx);
      setUser(userCtx);
      return userCtx;
    },
    async register(payload) {
      await authApi.register(payload);
    },
    logout() {
      clearAuthData();
      setAuthTokenState(null);
      setUser(null);
    },
    setDemoUser(nextUser) {
      setStoredUser(nextUser);
      setUser(nextUser);
    },
  }), [user, authToken, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
