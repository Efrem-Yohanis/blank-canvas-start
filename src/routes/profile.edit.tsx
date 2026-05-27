import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProtectedPage, SectionCard } from "@/components/ProtectedPage";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { userService } from "@/services/api";

export const Route = createFileRoute("/profile/edit")({
  head: () => ({ meta: [{ title: "Edit profile — Bible Quiz" }] }),
  component: EditProfile,
});

function EditProfile() {
  const qc = useQueryClient();
  const nav = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["user", "profile"], queryFn: () => userService.getProfile() });
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (data?.user) {
      setUsername(data.user.username);
      setEmail(data.user.email);
    }
  }, [data]);

  const mutation = useMutation({
    mutationFn: () => userService.updateProfile({ username, email }),
    onSuccess: () => {
      toast.success("Profile updated");
      qc.invalidateQueries({ queryKey: ["user"] });
      nav({ to: "/profile" });
    },
    onError: (e: any) => toast.error(e?.message ?? "Failed to update"),
  });

  return (
    <ProtectedPage max="max-w-xl">
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Edit profile</h1>
      <SectionCard title="Account">
        {isLoading ? (
          <Skeleton className="h-40" />
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <Field label="Username">
              <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => nav({ to: "/profile" })}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
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
