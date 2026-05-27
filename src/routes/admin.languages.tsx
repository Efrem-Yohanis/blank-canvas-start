import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminLanguage } from "@/services/admin";

export const Route = createFileRoute("/admin/languages")({
  component: LanguagesPage,
});

function LanguagesPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin", "languages"],
    queryFn: () => adminService.listLanguages(),
    retry: 0,
  });
  const [editing, setEditing] = useState<Partial<AdminLanguage> | null>(null);
  const [confirmDel, setConfirmDel] = useState<AdminLanguage | null>(null);

  const del = useMutation({
    mutationFn: (id: number) => adminService.deleteLanguage(id),
    onSuccess: () => {
      toast.success("Language deleted");
      qc.invalidateQueries({ queryKey: ["admin", "languages"] });
      setConfirmDel(null);
    },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  const langs = q.data?.languages ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl font-semibold text-foreground">Languages</h2>
          <p className="text-sm text-muted-foreground">{langs.length} configured</p>
        </div>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add language
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Native</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {q.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td></tr>
            ) : q.isError ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Couldn't load languages.</td></tr>
            ) : langs.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No languages.</td></tr>
            ) : langs.map((l) => (
              <tr key={l.language_id} className="hover:bg-secondary/30">
                <td className="px-4 py-3 text-muted-foreground">#{l.language_id}</td>
                <td className="px-4 py-3 font-mono text-xs">{l.code}</td>
                <td className="px-4 py-3 font-medium text-foreground">{l.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{l.native_name}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    l.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"
                  }`}>{l.is_active ? "Active" : "Inactive"}</span>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{l.questions_count ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(l)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDel(l)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <LanguageModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "languages"] })}
        />
      )}
      {confirmDel && (
        <ConfirmModal
          title="Delete language?"
          message={`This will permanently delete "${confirmDel.name}".`}
          onCancel={() => setConfirmDel(null)}
          onConfirm={() => del.mutate(confirmDel.language_id)}
          loading={del.isPending}
        />
      )}
    </div>
  );
}

function LanguageModal({ initial, onClose, onSaved }: { initial: Partial<AdminLanguage>; onClose: () => void; onSaved: () => void }) {
  const editing = !!initial.language_id;
  const [form, setForm] = useState({
    code: initial.code ?? "",
    name: initial.name ?? "",
    native_name: initial.native_name ?? "",
    is_active: initial.is_active ?? true,
  });
  const m = useMutation({
    mutationFn: () => editing
      ? adminService.updateLanguage(initial.language_id!, form)
      : adminService.createLanguage(form),
    onSuccess: () => { toast.success(editing ? "Updated" : "Created"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold">{editing ? "Edit" : "Add"} language</h3>
        {(["code", "name", "native_name"] as const).map((k) => (
          <div key={k}>
            <label className="mb-1 block text-xs font-medium capitalize text-muted-foreground">{k.replace("_", " ")}</label>
            <input
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              required
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
          Active
        </label>
        <div className="flex gap-2 pt-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-md border border-border py-2 text-sm">Cancel</button>
          <button disabled={m.isPending} type="submit" className="flex flex-1 items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />}Save
          </button>
        </div>
      </form>
    </div>
  );
}

export function ConfirmModal({ title, message, onCancel, onConfirm, loading }: { title: string; message: string; onCancel: () => void; onConfirm: () => void; loading?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-md border border-border px-3 py-2 text-sm">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="flex items-center gap-2 rounded-md bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-60">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Delete
          </button>
        </div>
      </div>
    </div>
  );
}
