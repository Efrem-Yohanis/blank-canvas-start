import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, Sparkles, RefreshCw, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function VerseExplainPanel({
  book,
  chapter,
  verse,
  text,
  reference,
}: {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  reference?: string;
}) {
  const { lang } = useI18n();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleCopy = async () => {
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const run = async () => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setContent("");
    setLoading(true);
    try {
      const resp = await fetch("/api/verse-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter, verse, text, reference, language: lang }),
        signal: ctrl.signal,
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({ error: "Failed" }));
        if (resp.status === 429) toast.error("Rate limit reached. Try again shortly.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add funds in Lovable.");
        else toast.error(err.error || "AI request failed");
        setLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      while (!done) {
        const { value, done: d } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { done = true; break; }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (delta) setContent((c) => c + delta);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e?.name !== "AbortError") toast.error(e?.message || "AI request failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    run();
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, chapter, verse, lang]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> AI Explanation
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            disabled={!content}
            aria-label="Copy explanation"
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={run}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-xs hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Regenerate
          </button>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        {loading && !content && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Thinking…
          </div>
        )}
        {content && (
          <div className="prose prose-sm dark:prose-invert max-w-none [&_h1]:font-serif [&_h2]:font-serif [&_h3]:font-serif">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
