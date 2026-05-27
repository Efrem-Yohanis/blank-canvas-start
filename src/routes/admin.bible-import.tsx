import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { quizService } from "@/services/api";
import { adminService } from "@/services/admin";

export const Route = createFileRoute("/admin/bible-import")({
  component: BibleImportPage,
});

type LogLine = { type: "info" | "success" | "error"; msg: string; at: string };

function BibleImportPage() {
  const langs = useQuery({ queryKey: ["quiz", "languages"], queryFn: () => quizService.getLanguages(), retry: 0 });
  const [language, setLanguage] = useState("");
  const [method, setMethod] = useState<"file" | "folder">("file");
  const [path, setPath] = useState("");
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const log = (l: LogLine) => setLogs((p) => [{ ...l, at: new Date().toLocaleTimeString() }, ...p].slice(0, 100));

  const m = useMutation({
    mutationFn: () => adminService.importBible({ language_code: language, file_path: path, batch: method === "folder" }),
    onMutate: () => { setProgress(10); log({ type: "info", msg: `Starting import from ${path}`, at: "" }); },
    onSuccess: (r) => {
      setProgress(100);
      log({ type: "success", msg: r.message || "Import started", at: "" });
      toast.success("Import requested");
    },
    onError: (e: any) => { setProgress(0); log({ type: "error", msg: e?.message || "Failed", at: "" }); toast.error(e?.message || "Failed"); },
  });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">Bible Import</h2>
        <p className="text-sm text-muted-foreground">Upload a single file or run a batch import.</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={(e) => { e.preventDefault(); if (!language || !path) return; m.mutate(); }} className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <Field label="Language">
            <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" required>
              <option value="">Select language</option>
              {(langs.data?.data ?? []).map((l) => <option key={l.language_id} value={l.code}>{l.name}</option>)}
            </select>
          </Field>
          <Field label="Import method">
            <div className="flex gap-2">
              {(["file", "folder"] as const).map((opt) => (
                <button key={opt} type="button" onClick={() => setMethod(opt)} className={`flex-1 rounded-md border px-3 py-2 text-sm capitalize ${method === opt ? "border-primary bg-primary/10 text-primary" : "border-border bg-background"}`}>
                  {opt === "file" ? "Single file" : "Folder (batch)"}
                </button>
              ))}
            </div>
          </Field>
          <Field label={method === "file" ? "File path" : "Folder path"}>
            <div className="flex gap-2">
              <input value={path} onChange={(e) => setPath(e.target.value)} placeholder="/path/to/file.json" className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm" required />
              <button type="button" onClick={() => toast.message("Use a server-side path the backend can read.")} className="rounded-md border border-border px-3 py-2 text-sm">Browse</button>
            </div>
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

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-serif text-lg font-semibold">Log</h3>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet.</p>
          ) : (
            <ul className="max-h-96 space-y-1 overflow-y-auto text-xs">
              {logs.map((l, i) => (
                <li key={i} className={`flex gap-2 rounded border px-2 py-1.5 ${
                  l.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : l.type === "error" ? "border-rose-200 bg-rose-50 text-rose-800"
                  : "border-border bg-secondary/40 text-foreground"
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
