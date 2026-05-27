import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import { Loader2, Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { adminService, type AdminBook } from "@/services/admin";
import { ConfirmModal } from "./admin.languages";

export const Route = createFileRoute("/admin/books")({
  component: BooksPage,
});

function BooksPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [testament, setTestament] = useState<"all" | "Old" | "New">("all");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [editing, setEditing] = useState<Partial<AdminBook> | null>(null);
  const [confirmDel, setConfirmDel] = useState<AdminBook | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["admin", "books", { search, testament, page }],
    queryFn: () => adminService.listBooks({ search, testament, page, limit }),
    retry: 0,
  });
  const books = q.data?.books ?? [];
  const totalPages = Math.max(1, Math.ceil((q.data?.total ?? 0) / limit));

  const del = useMutation({
    mutationFn: (id: number) => adminService.deleteBook(id),
    onSuccess: () => { toast.success("Book deleted"); qc.invalidateQueries({ queryKey: ["admin", "books"] }); setConfirmDel(null); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-semibold text-foreground">Books</h2>
        <button onClick={() => setEditing({})} className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
          <Plus className="h-4 w-4" /> Add book
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search book by name"
            className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select value={testament} onChange={(e) => { setTestament(e.target.value as any); setPage(1); }} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="all">All testaments</option>
          <option value="Old">Old</option>
          <option value="New">New</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="w-8 px-2 py-3" />
              <th className="px-4 py-3">Book</th>
              <th className="px-4 py-3">Testament</th>
              <th className="px-4 py-3">Chapters</th>
              <th className="px-4 py-3">Verses</th>
              <th className="px-4 py-3">Questions</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {q.isLoading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td></tr>
            ) : q.isError ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Couldn't load books.</td></tr>
            ) : books.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No books.</td></tr>
            ) : books.map((b) => (
              <Fragment key={b.book_id}>
                <tr className="hover:bg-secondary/30">
                  <td className="px-2 py-3">
                    <button onClick={() => setExpanded(expanded === b.book_id ? null : b.book_id)} className="grid h-6 w-6 place-items-center rounded hover:bg-secondary">
                      {expanded === b.book_id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">{b.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.testament}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.chapters_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.verses_count}</td>
                  <td className="px-4 py-3 text-muted-foreground">{b.questions_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setEditing(b)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
                      <button onClick={() => setConfirmDel(b)} className="grid h-8 w-8 place-items-center rounded-md hover:bg-destructive/10"><Trash2 className="h-4 w-4 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
                {expanded === b.book_id && (
                  <tr className="bg-secondary/30">
                    <td />
                    <td colSpan={6} className="px-4 py-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <Stat label="Chapters" value={b.chapters_count} />
                        <Stat label="Verses" value={b.verses_count} />
                        <Stat label="Questions" value={b.questions_count} />
                        <div className="rounded-lg border border-border bg-card p-3">
                          <div className="text-xs text-muted-foreground">Difficulty</div>
                          <div className="mt-1 flex gap-3 text-xs">
                            <span className="text-emerald-700">E {b.difficulty_breakdown?.easy ?? 0}</span>
                            <span className="text-amber-700">M {b.difficulty_breakdown?.medium ?? 0}</span>
                            <span className="text-rose-700">H {b.difficulty_breakdown?.hard ?? 0}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50">Prev</button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-md border border-border px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {editing && <BookModal initial={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "books"] })} />}
      {confirmDel && <ConfirmModal title="Delete book?" message={`This will delete "${confirmDel.name}".`} onCancel={() => setConfirmDel(null)} onConfirm={() => del.mutate(confirmDel.book_id)} loading={del.isPending} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function BookModal({ initial, onClose, onSaved }: { initial: Partial<AdminBook>; onClose: () => void; onSaved: () => void }) {
  const editing = !!initial.book_id;
  const [form, setForm] = useState({
    name: initial.name ?? "",
    testament: (initial.testament ?? "Old") as "Old" | "New",
    chapters_count: initial.chapters_count ?? 0,
  });
  const m = useMutation({
    mutationFn: () => editing
      ? adminService.updateBook(initial.book_id!, form)
      : adminService.createBook(form),
    onSuccess: () => { toast.success(editing ? "Updated" : "Created"); onSaved(); onClose(); },
    onError: (e: any) => toast.error(e?.message || "Failed"),
  });
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <form onSubmit={(e) => { e.preventDefault(); m.mutate(); }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md space-y-3 rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h3 className="font-serif text-lg font-semibold">{editing ? "Edit" : "Add"} book</h3>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Testament</label>
          <select value={form.testament} onChange={(e) => setForm({ ...form, testament: e.target.value as any })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="Old">Old</option>
            <option value="New">New</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">Chapters</label>
          <input type="number" min={0} value={form.chapters_count} onChange={(e) => setForm({ ...form, chapters_count: Number(e.target.value) })} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
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
