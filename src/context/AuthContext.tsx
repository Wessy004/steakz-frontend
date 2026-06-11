import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import axios from "axios";
import { api, setAuthToken } from "../api/client.js";
import type { ApiResponse, LoginResponse, User } from "../types/index.js";

type AuthContextValue = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  shortcutLogin: (userId: number) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const storedToken = localStorage.getItem("steakz-token");
const storedUser = localStorage.getItem("steakz-user");

if (storedToken) {
  setAuthToken(storedToken);
}

function getApiErrorMessage(data: unknown): string | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  if (!("error" in data) || typeof data.error !== "string") return undefined;
  return data.error;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(storedToken);
  const [user, setUser] = useState<User | null>(storedUser ? JSON.parse(storedUser) as User : null);

  async function login(email: string, password: string): Promise<void> {
    let response;
    try {
      response = await api.post<ApiResponse<LoginResponse>>("/auth/login", { email, password });
    } catch (caught) {
      if (axios.isAxiosError(caught)) {
        throw new Error(getApiErrorMessage(caught.response?.data) ?? "Login service is not reachable.");
      }

      throw new Error("Login failed.");
    }

    if (!response.data.success) {
      throw new Error(response.data.error ?? "Login failed.");
    }

    setToken(response.data.data.token);
    setUser(response.data.data.user);
    setAuthToken(response.data.data.token);
    localStorage.setItem("steakz-token", response.data.data.token);
    localStorage.setItem("steakz-user", JSON.stringify(response.data.data.user));
  }

  async function shortcutLogin(userId: number): Promise<void> {
    const response = await api.post<ApiResponse<LoginResponse>>("/auth/shortcut-login", { userId });
    if (!response.data.success) {
      throw new Error(response.data.error ?? "Login failed.");
    }

    setToken(response.data.data.token);
    setUser(response.data.data.user);
    setAuthToken(response.data.data.token);
    localStorage.setItem("steakz-token", response.data.data.token);
    localStorage.setItem("steakz-user", JSON.stringify(response.data.data.user));
  }

  function logout(): void {
    setToken(null);
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("steakz-token");
    localStorage.removeItem("steakz-user");
  }

  const value = useMemo(() => ({ token, user, login, shortcutLogin, logout }), [token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("AuthProvider is missing");
  }

  return context;
}
