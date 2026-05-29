import { useQueries } from "@tanstack/react-query";
import { Loader2, Languages } from "lucide-react";
import { bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";

export function VerseComparePanel({
  book,
  chapter,
  verse,
}: {
  book: string;
  chapter: number;
  verse: number;
}) {
  const { languages } = useI18n();

  const queries = useQueries({
    queries: languages.map((l) => ({
      queryKey: ["bible-verse", book, chapter, verse, l.code],
      queryFn: () => bibleService.getVerse(book, chapter, verse, l.code),
      staleTime: 1000 * 60 * 30,
      retry: 1,
    })),
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Languages className="h-4 w-4 text-primary" />
        Translations of {book} {chapter}:{verse}
      </div>
      {languages.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading languages…
        </div>
      ) : (
        <div className="space-y-2">
          {languages.map((l, i) => {
            const q = queries[i];
            const text = q.data?.text;
            return (
              <div
                key={l.code}
                className="rounded-lg border border-border bg-card p-3"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {l.native_name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{l.code}</span>
                </div>
                {q.isLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" /> Loading…
                  </div>
                ) : q.isError ? (
                  <p className="text-xs text-destructive">
                    Failed to load translation.
                  </p>
                ) : text ? (
                  <p className="font-serif text-base leading-relaxed text-foreground">
                    {text}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Verse not available in this language.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
