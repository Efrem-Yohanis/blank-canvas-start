import { Sparkles, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";

export function VerseOfTheDay() {
  const { lang } = useI18n();
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verse-of-the-day", lang],
    queryFn: () => bibleService.getVerseOfTheDay(lang),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const v = data?.data;

  return (
    <section
      aria-label="Verse of the day"
      className="mb-10 overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8"
    >
      <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Verse of the day
      </div>

      {isLoading ? (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading verse…
        </div>
      ) : isError || !v ? (
        <p className="mt-4 text-sm text-destructive">
          Could not load today’s verse. {(error as Error)?.message}
        </p>
      ) : (
        <>
          <blockquote className="mt-4 font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
            “{v.text}”
          </blockquote>
          <div className="mt-4 text-sm font-semibold text-primary">— {v.reference}</div>
        </>
      )}
    </section>
  );
}
