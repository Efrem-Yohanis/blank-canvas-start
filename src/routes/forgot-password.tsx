import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot password — Scripture" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => authService.forgotPassword(email.trim()),
    onSuccess: (res: any) => {
      setSent(true);
      const t = res?.token || res?.reset_token || res?.data?.token;
      if (t) {
        setDevToken(t);
        toast.success("Reset token generated");
      } else {
        toast.success("If the email exists, a reset link has been sent");
      }
    },
    onError: (e: any) => toast.error(e?.message || "Failed to send reset email"),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    mutation.mutate();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-xl font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" /> Scripture
        </Link>
        <h1 className="mb-1 text-center font-serif text-2xl font-semibold text-foreground">
          Forgot password
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter your email and we'll send you a link to reset your password.
        </p>

        {!sent ? (
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <Button type="submit" disabled={mutation.isPending} className="w-full">
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset link
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border border-border bg-secondary/40 p-4 text-sm text-foreground">
              Check your email for a reset link. The link is valid for 1 hour.
            </div>
            {devToken && (
              <div className="rounded-md border border-dashed border-border p-3 text-xs">
                <p className="mb-2 font-medium text-foreground">Reset token (dev):</p>
                <code className="block break-all rounded bg-muted p-2 text-[11px]">{devToken}</code>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => nav({ to: "/reset-password", search: { token: devToken } as any })}
                >
                  Continue to reset
                </Button>
              </div>
            )}
            <Link to="/login" className="block text-center text-xs text-primary hover:underline">
              Back to sign in
            </Link>
          </div>
        )}

        {!sent && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Remember your password?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
