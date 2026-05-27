import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Copy, Check, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";
import { findBook, localizedBookName } from "@/data/bible";

export const Route = createFileRoute("/book/$book")({
  head: () => ({ meta: [{ title: "Book — Bible" }] }),
  component: BookDetailPage,
});

function slugToBookName(slug: string): string {
  return slug
    .split("-")
    .map((p) => (p.match(/^\d+$/) ? p : p.charAt(0).toUpperCase() + p.slice(1)))
    .join(" ");
}

function BookDetailPage() {
  const { book: slug } = Route.useParams();
  const { lang } = useI18n();
  const bookName = findBook(slug)?.name ?? slugToBookName(slug);
  const localized = localizedBookName(bookName, lang);

  const fullQ = useQuery({
    queryKey: ["bible-full-book", bookName, lang],
    queryFn: () => bibleService.getFullBook(bookName, lang),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const chapters = fullQ.data?.chapters ?? [];
  const [activeChapter, setActiveChapter] = useState<number | null>(null);
  const currentChapter = useMemo(() => {
    if (!chapters.length) return null;
    return chapters.find((c) => c.chapter === activeChapter) ?? chapters[0];
  }, [chapters, activeChapter]);
  const currentIdx = currentChapter
    ? chapters.findIndex((c) => c.chapter === currentChapter.chapter)
    : -1;
  const prevChapter = currentIdx > 0 ? chapters[currentIdx - 1] : null;
  const nextChapter =
    currentIdx >= 0 && currentIdx < chapters.length - 1 ? chapters[currentIdx + 1] : null;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!currentChapter) return;
    const text = currentChapter.verses.map((v) => `${v.verse} ${v.text}`).join(" ");
    const header = `${localized} ${currentChapter.chapter}\n\n`;
    try {
      await navigator.clipboard.writeText(header + text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* noop */
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All books
        </Link>

        <section className="mb-10 overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
          <div className="relative px-8 py-12 text-center sm:px-12 sm:py-14">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-10 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />
            <div className="relative inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              <BookOpen className="h-3.5 w-3.5" /> Bible Book
            </div>
            <h1 className="relative mt-3 font-serif text-4xl font-semibold text-foreground sm:text-6xl">
              {localized}
            </h1>
            {localized !== bookName && (
              <p className="relative mt-2 text-sm text-muted-foreground">{bookName}</p>
            )}
            <div className="relative mt-6 flex justify-center">
              <Link
                to="/quiz-setup/$book"
                params={{ book: slug }}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
              >
                Take Quiz
              </Link>
            </div>
          </div>
        </section>

        {fullQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading {bookName}…
          </div>
        ) : fullQ.isError ? (
          <div className="border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            Failed to load book. {(fullQ.error as Error)?.message}
          </div>
        ) : chapters.length === 0 ? (
          <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
            No chapters available.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[140px_1fr]">
            <aside className="md:sticky md:top-20 md:self-start">
              <div className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Chapters
                  </h2>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {chapters.length}
                  </span>
                </div>
                <div className="flex max-h-[68vh] flex-col gap-1.5 overflow-y-auto pr-1">
                  {chapters.map((c) => {
                    const active = c.chapter === currentChapter?.chapter;
                    return (
                      <button
                        key={c.chapter}
                        onClick={() => setActiveChapter(c.chapter)}
                        className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition ${
                          active
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "bg-secondary/70 text-foreground hover:bg-primary/10 hover:text-primary"
                        }`}
                      >
                        Chapter {c.chapter}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>

            {currentChapter && (
              <article className="min-w-0">
                <div className="relative rounded-3xl border border-border/60 bg-card px-6 py-10 shadow-sm sm:px-12 sm:py-14">
                  <button
                    onClick={handleCopy}
                    aria-label="Copy chapter"
                    className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/40 hover:text-primary"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </>
                    )}
                  </button>
                  <header className="mb-10 text-center">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary">
                      Chapter
                    </p>
                    <div className="mt-1 font-serif text-6xl font-semibold text-foreground sm:text-7xl">
                      {currentChapter.chapter}
                    </div>
                    <div className="mx-auto mt-4 flex items-center justify-center gap-3 text-muted-foreground">
                      <span className="h-px w-10 bg-border" />
                      <span className="text-xs uppercase tracking-[0.2em]">{localized}</span>
                      <span className="h-px w-10 bg-border" />
                    </div>
                  </header>

                  <div className="mx-auto max-w-3xl font-serif text-[1.35rem] leading-[2.1] text-foreground/90 sm:text-[1.5rem] sm:leading-[2.2]">
                    {currentChapter.verses.map((v, i) => (
                      <span key={v.verse}>
                        {i === 0 ? (
                          <span className="float-left mr-3 mt-2 font-serif text-7xl font-semibold leading-none text-primary">
                            {v.text.charAt(0)}
                          </span>
                        ) : null}
                        <sup className="mr-1 select-none align-super text-[0.75rem] font-bold text-primary/70">
                          {v.verse}
                        </sup>
                        {i === 0 ? v.text.slice(1) : v.text}
                        {" "}
                      </span>
                    ))}
                  </div>
                </div>

                <nav className="mx-auto mt-8 flex items-center justify-between gap-3">
                  <button
                    disabled={!prevChapter}
                    onClick={() => prevChapter && setActiveChapter(prevChapter.chapter)}
                    className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition hover:-translate-x-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="flex flex-col items-start leading-tight">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Previous
                      </span>
                      <span>{prevChapter ? `Chapter ${prevChapter.chapter}` : "—"}</span>
                    </span>
                  </button>
                  <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
                    {currentChapter.chapter} / {chapters.length}
                  </span>
                  <button
                    disabled={!nextChapter}
                    onClick={() => nextChapter && setActiveChapter(nextChapter.chapter)}
                    className="group inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-sm font-medium text-foreground shadow-sm transition hover:translate-x-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-x-0"
                  >
                    <span className="flex flex-col items-end leading-tight">
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        Next
                      </span>
                      <span>{nextChapter ? `Chapter ${nextChapter.chapter}` : "—"}</span>
                    </span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </nav>
              </article>
            )}
          </div>
        )}
      </main>
    </div>
  );
}