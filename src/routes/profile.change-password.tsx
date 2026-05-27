import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ProtectedPage, SectionCard } from "@/components/ProtectedPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { userService } from "@/services/api";

export const Route = createFileRoute("/profile/change-password")({
  head: () => ({ meta: [{ title: "Change password — Bible Quiz" }] }),
  component: ChangePassword,
});

function ChangePassword() {
  const nav = useNavigate();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const mutation = useMutation({
    mutationFn: () => userService.changePassword({ current_password: current, new_password: next }),
    onSuccess: () => {
      toast.success("Password updated");
      nav({ to: "/profile" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update password"),
  });

  const validate = () => {
    if (next.length < 6) return "At least 6 characters required";
    if (!/[0-9]/.test(next)) return "Must include at least 1 number";
    if (!/[A-Z]/.test(next)) return "Must include at least 1 uppercase letter";
    if (next !== confirm) return "Passwords do not match";
    return null;
  };

  return (
    <ProtectedPage max="max-w-xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Change password</h1>
      <SectionCard title="Set a new password">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const err = validate();
            if (err) return toast.error(err);
            mutation.mutate();
          }}
        >
          <Field label="Current password">
            <Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
          </Field>
          <Field label="New password">
            <Input type="password" value={next} onChange={(e) => setNext(e.target.value)} required />
          </Field>
          <Field label="Confirm password">
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </Field>

          <ul className="space-y-1 rounded-lg border border-dashed border-border bg-secondary/40 p-3 text-xs text-muted-foreground">
            <li>• At least 6 characters</li>
            <li>• At least 1 number</li>
            <li>• At least 1 uppercase letter</li>
          </ul>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => nav({ to: "/profile" })}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating…" : "Update password"}
            </Button>
          </div>
        </form>
      </SectionCard>
    </ProtectedPage>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
