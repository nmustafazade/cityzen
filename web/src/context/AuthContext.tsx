"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiRequest } from "@/lib/api";
import { getStoredToken, removeStoredToken, storeToken } from "@/lib/auth";
import type {
  AuthResponse,
  CurrentUserResponse,
  LoginCredentials,
  RegisterDetails,
} from "@/types/auth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (details: RegisterDetails) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(() => {
    removeStoredToken();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    async function initializeAuth() {
      const storedToken = getStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await apiRequest<CurrentUserResponse>("/api/auth/me", {
          token: storedToken,
        });
        setToken(storedToken);
        setUser(response.user);
      } catch {
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    }

    void initializeAuth();
  }, [clearAuth]);

  const applyAuth = useCallback((response: AuthResponse) => {
    storeToken(response.token);
    setToken(response.token);
    setUser(response.user);
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      const response = await apiRequest<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: credentials,
      });
      applyAuth(response);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (details: RegisterDetails) => {
      const response = await apiRequest<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: details,
      });
      applyAuth(response);
    },
    [applyAuth],
  );

  const refreshUser = useCallback(async () => {
    const currentToken = token ?? getStoredToken();
    if (!currentToken) {
      clearAuth();
      return;
    }

    try {
      const response = await apiRequest<CurrentUserResponse>("/api/auth/me", {
        token: currentToken,
      });
      setToken(currentToken);
      setUser(response.user);
    } catch (error) {
      clearAuth();
      throw error;
    }
  }, [clearAuth, token]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      login,
      register,
      logout: clearAuth,
      refreshUser,
    }),
    [clearAuth, isLoading, login, refreshUser, register, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
