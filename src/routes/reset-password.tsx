import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authService } from "@/services/api";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset password — Scripture" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    token: typeof s.token === "string" ? s.token : "",
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const nav = useNavigate();
  const { token: searchToken } = Route.useSearch();
  const [token, setToken] = useState(searchToken || "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  useEffect(() => {
    if (searchToken) setToken(searchToken);
  }, [searchToken]);

  const mutation = useMutation({
    mutationFn: () => authService.resetPassword(token.trim(), password),
    onSuccess: () => {
      toast.success("Password reset. Please sign in.");
      nav({ to: "/login" });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to reset password"),
  });

  const validate = () => {
    if (!token) return "Reset token is required";
    if (password.length < 6) return "At least 6 characters required";
    if (!/[0-9]/.test(password)) return "Must include at least 1 number";
    if (!/[A-Z]/.test(password)) return "Must include at least 1 uppercase letter";
    if (password !== confirm) return "Passwords do not match";
    return null;
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) return toast.error(err);
    mutation.mutate();
  };

  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 font-serif text-xl font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" /> Scripture
        </Link>
        <h1 className="mb-1 text-center font-serif text-2xl font-semibold text-foreground">
          Reset password
        </h1>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          Enter the token from your email and choose a new password.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Reset token</label>
            <Input value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">New password</label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Confirm password</label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </div>

          <ul className="space-y-1 rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <li>• At least 6 characters</li>
            <li>• At least 1 number</li>
            <li>• At least 1 uppercase letter</li>
          </ul>

          <Button type="submit" disabled={mutation.isPending} className="w-full">
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
