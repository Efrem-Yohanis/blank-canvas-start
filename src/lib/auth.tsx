import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { authService, setToken, userService, SESSION_EXPIRED_EVENT } from "@/services/api";
import { syncPendingProgress } from "@/lib/audio-progress";

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

  // Global handler: backend rejected a call with 401 → session expired.
  // Log the user out but keep them on whichever page they're on (typically
  // home) so they can see the login button. Show a popup notification.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track last user interaction (keyboard, pointer, touch, scroll).
    let lastInteraction = Date.now();
    const bump = () => {
      lastInteraction = Date.now();
    };
    const events = ["pointerdown", "keydown", "touchstart", "scroll", "mousemove"];
    events.forEach((e) =>
      window.addEventListener(e, bump, { passive: true } as AddEventListenerOptions)
    );

    // Keep session alive while user is active or audio is playing:
    // only force-logout when the tab has been idle (no interaction for 15min)
    // AND no audio is currently playing.
    const IDLE_MS = 15 * 60 * 1000;
    const onExpired = () => {
      const audioPlaying = !!(window as any).__bibleAudioPlaying;
      const idle = Date.now() - lastInteraction > IDLE_MS;
      if (audioPlaying || !idle) {
        // Stay signed in — the user is actively using the app.
        return;
      }
      setUser(null);
      setToken(null);
      try {
        localStorage.removeItem("bible.user");
      } catch {}
      toast.error("Your session has expired. Please sign in again.", {
        duration: 6000,
      });
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, []);

  // Handle OAuth redirect: backend redirects to /?access_token=...&refresh_token=...&user_id=...
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    if (!accessToken) return;

    const username = params.get("username") || params.get("display_name") || "";
    const email = params.get("email") || "";
    const isAdmin = params.get("is_admin") === "true";

    setToken(accessToken);

    const u: User = {
      name: username || email.split("@")[0] || "User",
      email,
      role: deriveRole({ is_admin: isAdmin }, email),
    };
    persist(u);
    // Backend (Google) login: flush any anonymous progress collected on this device.
    syncPendingProgress().catch(() => {});

    // Strip auth params from the URL so tokens aren't left in history/shared links
    const url = new URL(window.location.href);
    [
      "access_token",
      "refresh_token",
      "user_id",
      "username",
      "email",
      "display_name",
      "is_admin",
      "token_type",
      "expires_at",
    ].forEach((k) => url.searchParams.delete(k));
    window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);

    // If profile fetch reveals a better username/role, refresh in background
    userService
      .getProfile()
      .then((res) => {
        const profile: any = res.user;
        persist({
          name: profile?.username || u.name,
          email: profile?.email || u.email,
          role: deriveRole(profile, profile?.email || u.email),
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setToken(res.data.access_token);
    const u: User = {
      name: res.data?.username || email.split("@")[0],
      email: email,
      role: deriveRole({ is_admin: res.data?.is_admin }, email),
    };
    persist(u);
    syncPendingProgress().catch(() => {});
    return u;
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await authService.register(email, password, username);
    // Django register doesn't return a token; auto-login after registration
    const loginRes = await authService.login(email, password);
    setToken(loginRes.data.access_token);
    const u: User = {
      name: loginRes.data?.username || username,
      email: email,
      role: deriveRole({ is_admin: loginRes.data?.is_admin }, email),
    };
    persist(u);
    syncPendingProgress().catch(() => {});
    return u;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {}
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
    syncPendingProgress().catch(() => {});
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