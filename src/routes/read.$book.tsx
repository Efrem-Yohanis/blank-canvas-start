import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";
import { findBook, localizedBookName } from "@/data/bible";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/read/$book")({
  validateSearch: (search: Record<string, unknown>) => {
    const n = Number(search.chapter);
    return { chapter: Number.isFinite(n) && n > 0 ? n : undefined };
  },
  component: ReadPage,
});

function ReadPage() {
  const { book: slug } = Route.useParams();
  const { chapter: selectedChapter } = Route.useSearch();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const localBook = findBook(slug);
  const bookName = localBook?.name ?? slug.replace(/-/g, " ");

  const chaptersQ = useQuery({
    queryKey: ["bible-chapters", bookName, lang],
    queryFn: () => bibleService.getChapters(bookName, lang),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const chapterNum =
    selectedChapter ?? chaptersQ.data?.chapters?.[0];

  const chapterQ = useQuery({
    queryKey: ["bible-chapter", bookName, lang, chapterNum],
    queryFn: () => bibleService.getChapter(bookName, chapterNum!, lang),
    enabled: !!chapterNum,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const localized = localizedBookName(bookName, lang);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="border-b border-border bg-card/50">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> {t.backToBooks}
          </Link>
          <h1 className="font-serif text-lg font-semibold text-foreground">{localized}</h1>
          <span />
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4 py-8">
        <header className="mb-6">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">{lang}</p>
          <h2 className="font-serif text-3xl font-semibold text-foreground">{localized}</h2>
        </header>

        {chaptersQ.isLoading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading chapters…
          </div>
        ) : chaptersQ.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load chapters. {(chaptersQ.error as Error)?.message}
          </div>
        ) : (
          <div className="mb-8 flex flex-wrap gap-2">
            {(chaptersQ.data?.chapters ?? []).map((c) => (
              <button
                key={c}
                onClick={() =>
                  navigate({ to: "/read/$book", params: { book: slug }, search: { chapter: c } })
                }
                className={`min-w-10 px-3 py-1.5 text-sm font-medium border transition ${
                  c === chapterNum
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-foreground hover:border-primary/40"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {chapterQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading chapter…
          </div>
        ) : chapterQ.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load chapter. {(chapterQ.error as Error)?.message}
          </div>
        ) : chapterQ.data ? (
          <article className="pb-16">
            <h3 className="mb-3 font-serif text-2xl font-semibold text-foreground">
              {t.chapter} {chapterQ.data.chapter}
            </h3>
            <div className="prose prose-stone max-w-none font-serif text-lg leading-relaxed text-foreground">
              {chapterQ.data.verses.map((v) => (
                <p key={v.verse} className="mb-3">
                  <sup className="mr-1 text-xs font-semibold text-primary">{v.verse}</sup>
                  {v.text}
                </p>
              ))}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  );
}