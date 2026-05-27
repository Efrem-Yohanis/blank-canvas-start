import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Loader2, Upload, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { quizService } from "@/services/api";
import { adminService } from "@/services/admin";

export const Route = createFileRoute("/admin/questions-import")({
  component: QuestionsImportPage,
});

type LogLine = { type: "info" | "success" | "error"; msg: string; at: string };

function QuestionsImportPage() {
  const langs = useQuery({ queryKey: ["quiz", "languages"], queryFn: () => quizService.getLanguages(), retry: 0 });
  const books = useQuery({ queryKey: ["quiz", "books"], queryFn: () => quizService.getBooks(), retry: 0 });

  const [language, setLanguage] = useState("");
  const [book, setBook] = useState("");
  const [method, setMethod] = useState<"file" | "folder">("file");
  const [path, setPath] = useState("");
  const [json, setJson] = useState("");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const log = (l: Omit<LogLine, "at">) => setLogs((p) => [{ ...l, at: new Date().toLocaleTimeString() }, ...p].slice(0, 100));

  const localValidation = useMemo(() => {
    if (!json.trim()) return null;
    try {
      const parsed = JSON.parse(json);
      const arr = Array.isArray(parsed) ? parsed : parsed.questions ?? [];
      const total = arr.length;
      const difficulty = { easy: 0, medium: 0, hard: 0 };
      arr.forEach((q: any) => {
        const d = String(q.difficulty || q.level || "").toLowerCase();
        if (d in difficulty) (difficulty as any)[d] += 1;
      });
      return { valid: true, total, difficulty, sample: arr[0] };
    } catch (e: any) {
      return { valid: false, error: e?.message };
    }
  }, [json]);

  const m = useMutation({
    mutationFn: () => adminService.importQuestions({ language_code: language, book_name: book, file_path: path, batch: method === "folder" }),
    onMutate: () => { setProgress(10); log({ type: "info", msg: `Starting questions import (${book})` }); },
    onSuccess: (r) => { setProgress(100); log({ type: "success", msg: r.message || "Started" }); toast.success("Import requested"); },
    onError: (e: any) => { setProgress(0); log({ type: "error", msg: e?.message || "Failed" }); toast.error(e?.message || "Failed"); },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">Questions Import</h2>
        <p className="text-sm text-muted-foreground">Validate then import questions per book.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={(e) => { e.preventDefault(); if (!language || !book || !path) return; m.mutate(); }} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Language">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select</option>
                {(langs.data?.data ?? []).map((l) => <option key={l.language_id} value={l.code}>{l.name}</option>)}
              </select>
            </Field>
            <Field label="Book">
              <select value={book} onChange={(e) => setBook(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
                <option value="">Select</option>
                {(books.data?.data ?? []).map((b) => <option key={b.book_id} value={b.name}>{b.name}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Import method">
            <div className="flex gap-2">
              {(["file", "folder"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setMethod(opt)} className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${method === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                  {opt === "file" ? "Single file" : "Folder (batch)"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="File path">
            <div className="flex gap-2">
              <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/path/to/questions.json" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" required />
              <button type="button" onClick={() => toast.message("Server-side path expected.")} className="rounded-md border border-border px-3 py-2 text-sm">Browse</button>
            </div>
          </Field>
          <Field label="Paste JSON (optional, for client-side preview/validation)">
            <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={6} className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs" placeholder='[{"text":"...","difficulty":"easy",...}]' />
          </Field>
          <button type="submit" disabled={m.isPending} className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {m.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Start import
          </button>
          <div>
            <div className="mb-1 flex justify-between text-xs text-muted-foreground"><span>Progress</span><span>{progress}%</span></div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="mb-3 font-serif text-lg font-semibold">Preview & validation</h3>
            {!localValidation ? (
              <p className="text-sm text-muted-foreground">Paste JSON to see preview.</p>
            ) : !localValidation.valid || !localValidation.difficulty ? (
              <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
                <AlertCircle className="mt-0.5 h-4 w-4" />
                <span>Invalid JSON{localValidation.error ? `: ${localValidation.error}` : ""}</span>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2 text-emerald-700"><CheckCircle2 className="h-4 w-4" />Valid JSON</div>
                <div className="grid grid-cols-4 gap-2">
                  <Cell label="Total" value={localValidation.total} />
                  <Cell label="Easy" value={localValidation.difficulty.easy} />
                  <Cell label="Medium" value={localValidation.difficulty.medium} />
                  <Cell label="Hard" value={localValidation.difficulty.hard} />
                </div>
                {localValidation.sample && (
                  <div className="rounded-md border border-border bg-secondary/40 p-3">
                    <div className="mb-1 text-xs font-medium text-muted-foreground">Sample</div>
                    <pre className="overflow-x-auto text-xs">{JSON.stringify(localValidation.sample, null, 2)}</pre>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-serif text-lg font-semibold">Log</h3>
            </div>
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto text-xs">
                {logs.map((l, i) => (
                  <li key={i} className={`flex gap-2 rounded border px-2 py-1.5 ${
                    l.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : l.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800"
                    : "border-border bg-secondary/40"
                  }`}>
                    <span className="text-muted-foreground">{l.at}</span>
                    <span>{l.msg}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-background p-2 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}
