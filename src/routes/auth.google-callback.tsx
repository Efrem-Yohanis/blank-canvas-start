import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { authService, setToken } from "@/services/api";

export const Route = createFileRoute("/auth/google-callback")({
  head: () => ({ meta: [{ title: "Signing you in — Scripture" }] }),
  component: GoogleCallbackPage,
});

function GoogleCallbackPage() {
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const err = url.searchParams.get("error");
        if (err) throw new Error(err);

        // Backend may redirect with tokens directly as URL params
        const directToken =
          url.searchParams.get("access_token") ||
          url.searchParams.get("token") ||
          new URLSearchParams(url.hash.replace(/^#/, "")).get("access_token");

        if (directToken) {
          const refresh = url.searchParams.get("refresh_token");
          if (refresh) {
            try {
              localStorage.setItem("bible.refresh_token", refresh);
            } catch {}
          }
          setToken(directToken);
          const u = await loginWithToken(directToken);
          toast.success("Signed in with Google");
          navigate({ to: u.role === "admin" ? "/admin" : "/" });
          return;
        }

        // Or backend may redirect with a ?code to exchange
        const code = url.searchParams.get("code");
        if (code) {
          const res = await authService.googleCallback(code);
          setToken(res.data.access_token);
          if (res.data.refresh_token) {
            try {
              localStorage.setItem("bible.refresh_token", res.data.refresh_token);
            } catch {}
          }
          const u = await loginWithToken(res.data.access_token);
          toast.success("Signed in with Google");
          navigate({ to: u.role === "admin" ? "/admin" : "/" });
          return;
        }

        throw new Error("Missing authorization code or access token");
      } catch (e: any) {
        setError(e?.message || "Google login failed. Please try again.");
      }
    };
    run();
  }, [loginWithToken, navigate]);

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        {error ? (
          <>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-destructive" />
            <h1 className="mb-1 font-serif text-xl font-semibold text-foreground">
              Google login failed
            </h1>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <button
              onClick={() => navigate({ to: "/login" })}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Back to login
            </button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <h1 className="mb-1 font-serif text-xl font-semibold text-foreground">
              Signing you in with Google…
            </h1>
            <p className="text-sm text-muted-foreground">
              Please wait while we complete your login.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
