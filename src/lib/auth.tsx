import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { authService, setToken, userService } from "@/services/api";

export type QuizResult = {
  book: string;
  level: number;
  score: number;
  total: number;
  date: string;
};

type User = { name: string; email: string; role: "admin" | "user" };

type AuthCtx = {
  user: User | null;
  results: QuizResult[];
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<User>;
  loginWithToken: (token: string) => Promise<User>;
  logout: () => void;
  addResult: (r: QuizResult) => void;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    try {
      const u = localStorage.getItem("bible.user");
      const r = localStorage.getItem("bible.results");
      if (u) setUser(JSON.parse(u));
      if (r) setResults(JSON.parse(r));
    } catch {}
  }, []);

  const deriveRole = (raw: any, email: string): "admin" | "user" => {
    const r = raw?.role ?? raw?.user_role ?? raw?.type;
    if (r === "admin" || raw?.is_admin) return "admin";
    if (email.toLowerCase().startsWith("admin")) return "admin";
    return "user";
  };

  const persist = (u: User) => {
    setUser(u);
    localStorage.setItem("bible.user", JSON.stringify(u));
  };

  const login = async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setToken(res.token);
    const u: User = {
      name: res.user?.username || email.split("@")[0],
      email: res.user?.email || email,
      role: deriveRole(res.user, email),
    };
    persist(u);
    return u;
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await authService.register(email, password, username);
    setToken(res.token);
    const u: User = {
      name: res.user?.username || username,
      email: res.user?.email || email,
      role: deriveRole(res.user, email),
    };
    persist(u);
    return u;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("bible.user");
  };

  const loginWithToken = async (token: string) => {
    setToken(token);
    let u: User;
    try {
      const res = await userService.getProfile();
      const profile: any = res.user;
      u = {
        name: profile?.username || profile?.email?.split("@")[0] || "User",
        email: profile?.email || "",
        role: deriveRole(profile, profile?.email || ""),
      };
    } catch {
      u = { name: "User", email: "", role: "user" };
    }
    persist(u);
    return u;
  };

  const addResult = (r: QuizResult) => {
    setResults((prev) => {
      const next = [r, ...prev].slice(0, 50);
      localStorage.setItem("bible.results", JSON.stringify(next));
      return next;
    });
  };

  return (
    <Ctx.Provider value={{ user, results, login, register, loginWithToken, logout, addResult }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}