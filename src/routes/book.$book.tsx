import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BookOpen, ChevronLeft, ChevronRight, Copy, Check, Loader2, X, Highlighter, Languages, Sparkles, Volume2, CheckCircle2, Download, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import { Header } from "@/components/Header";
import { audioService, bibleService } from "@/services/api";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { findBook, localizedBookName } from "@/data/bible";
import { VerseComparePanel } from "@/components/VerseComparePanel";
import { VerseExplainPanel } from "@/components/VerseExplainPanel";
import { ChapterAudioPlayer } from "@/components/ChapterAudioPlayer";

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

type PanelTab = "compare" | "explain";

function BookDetailPage() {
  const { book: slug } = Route.useParams();
  const { lang } = useI18n();
  const { user } = useAuth();
  const bookName = findBook(slug)?.name ?? slugToBookName(slug);
  const localized = localizedBookName(bookName, lang);

  const fullQ = useQuery({
    queryKey: ["bible-full-book", bookName, lang],
    queryFn: () => bibleService.getFullBook(bookName, lang),
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const chapters = fullQ.data?.chapters ?? [];
  const bookId = fullQ.data?.book_id;

  const progressQ = useQuery({
    queryKey: ["audio-progress", bookId, user?.email],
    queryFn: () => audioService.getProgress(bookId!),
    enabled: !!user && !!bookId,
    retry: 0,
  });
  const completedChapters = new Set<number>(progressQ.data?.data?.completed_chapters ?? []);
  const progressPct = progressQ.data?.data?.progress_percentage ?? 0;

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
  const [chapterListCollapsed, setChapterListCollapsed] = useState(false);

  // Verse interaction state
  const [openVerse, setOpenVerse] = useState<number | null>(null);
  const [activeVerse, setActiveVerse] = useState<{ verse: number; text: string } | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab | null>(null);
  const highlightKey = `bible.highlights.${bookName}`;
  const [highlights, setHighlights] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try {
      const raw = localStorage.getItem(highlightKey);
      setHighlights(raw ? JSON.parse(raw) : {});
    } catch {
      setHighlights({});
    }
  }, [highlightKey]);

  const persistHighlights = (next: Record<string, boolean>) => {
    setHighlights(next);
    try {
      localStorage.setItem(highlightKey, JSON.stringify(next));
    } catch {}
  };

  const verseKey = (ch: number, v: number) => `${ch}:${v}`;

  const toggleHighlight = (ch: number, v: number) => {
    const k = verseKey(ch, v);
    const next = { ...highlights };
    if (next[k]) delete next[k];
    else next[k] = true;
    persistHighlights(next);
  };

  const handleCopy = async () => {
    if (!currentChapter) return;
    const text = currentChapter.verses.map((v) => `${v.verse} ${v.text}`).join(" ");
    const header = `${localized} ${currentChapter.chapter}\n\n`;
    try {
      await navigator.clipboard.writeText(header + text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const handleDownloadPdf = () => {
    if (!currentChapter) return;
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let y = margin;

    doc.setFont("times", "bold");
    doc.setFontSize(20);
    doc.text(`${localized} ${currentChapter.chapter}`, pageWidth / 2, y, { align: "center" });
    y += 30;

    doc.setFont("times", "normal");
    doc.setFontSize(12);
    const body = currentChapter.verses.map((v) => `${v.verse}  ${v.text}`).join("\n\n");
    const lines = doc.splitTextToSize(body, maxWidth);
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    }
    doc.save(`${bookName}-chapter-${currentChapter.chapter}.pdf`);
  };

  const closePanel = () => {
    setPanelTab(null);
    setActiveVerse(null);
    setOpenVerse(null);
  };

  // Close panel when chapter changes
  useEffect(() => {
    closePanel();
  }, [currentChapter?.chapter]);

  const showPanel = panelTab !== null && activeVerse !== null && currentChapter !== null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <Header />

      <main className="mx-auto w-[90%] py-8">
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
          <div
            className={`grid gap-6 ${
              showPanel ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,380px)]" : "grid-cols-1"
            }`}
          >
            <div className="min-w-0 space-y-6">
              {/* Audio player — spans full width above the chapter+text grid */}
              {currentChapter && (
                <ChapterAudioPlayer
                  bookId={bookId}
                  chapter={currentChapter.chapter}
                  audioUrl={currentChapter.audio_url}
                  language={lang}
                  hasPrev={!!prevChapter}
                  hasNext={!!nextChapter}
                  onPrev={() => prevChapter && setActiveChapter(prevChapter.chapter)}
                  onNext={() => nextChapter && setActiveChapter(nextChapter.chapter)}
                  onCompleted={() => progressQ.refetch()}
                />
              )}

              {/* Chapter list (vertical) + Bible text grid */}
              <div
                className={`grid gap-6 ${
                  chapterListCollapsed
                    ? "lg:grid-cols-[64px_minmax(0,1fr)]"
                    : "lg:grid-cols-[minmax(220px,260px)_minmax(0,1fr)]"
                }`}
              >
                <aside className="rounded-2xl border border-border/60 bg-card/80 p-3 shadow-sm backdrop-blur lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
                  <div className={`mb-2 flex items-center px-1 ${chapterListCollapsed ? "justify-center" : "justify-between"}`}>
                    {!chapterListCollapsed && (
                      <>
                        <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                          Chapters
                        </h2>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {chapters.length}
                        </span>
                      </>
                    )}
                    <button
                      onClick={() => setChapterListCollapsed((c) => !c)}
                      aria-label={chapterListCollapsed ? "Expand chapter list" : "Collapse chapter list"}
                      title={chapterListCollapsed ? "Expand" : "Collapse"}
                      className={`rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground ${chapterListCollapsed ? "" : "ml-2"}`}
                    >
                      {chapterListCollapsed ? <ChevronsRight className="h-3.5 w-3.5" /> : <ChevronsLeft className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {chapters.map((c) => {
                      const active = c.chapter === currentChapter?.chapter;
                      const done = completedChapters.has(c.chapter);
                      return (
                        <button
                          key={c.chapter}
                          onClick={() => setActiveChapter(c.chapter)}
                          title={`Chapter ${c.chapter}`}
                          className={`group flex w-full items-center ${chapterListCollapsed ? "justify-center px-0" : "justify-between px-3"} gap-2 rounded-lg py-2 text-sm font-semibold transition ${
                            active
                              ? "bg-primary text-primary-foreground shadow-md"
                              : done
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20"
                              : "bg-secondary/70 text-foreground hover:bg-primary/10 hover:text-primary"
                          }`}
                        >
                          {chapterListCollapsed ? (
                            <span>{c.chapter}</span>
                          ) : (
                            <>
                              <span className="flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 opacity-70" />
                                Chapter {c.chapter}
                              </span>
                              <span className="flex items-center gap-1.5">
                                {active && (
                                  <span className="relative flex h-2 w-2">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-60" />
                                    <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
                                  </span>
                                )}
                                {done && <CheckCircle2 className="h-3.5 w-3.5" />}
                                {c.has_audio && <Volume2 className="h-3.5 w-3.5 opacity-70" />}
                              </span>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {!chapterListCollapsed && user && progressQ.data && (
                    <div className="mt-3 px-1">
                      <div className="mb-1 flex justify-between text-[10px] font-medium text-muted-foreground">
                        <span>Progress</span>
                        <span>{progressPct}%</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </aside>

                {currentChapter && (
                  <article className="min-w-0">
                  <div className="relative rounded-3xl border border-border/60 bg-card px-6 py-10 shadow-sm sm:px-12 sm:py-14">
                    <div className="absolute right-4 top-4 flex items-center gap-2">
                      <button
                        onClick={handleCopy}
                        aria-label="Copy chapter"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/40 hover:text-primary"
                      >
                        {copied ? (
                          <><Check className="h-3.5 w-3.5" /> Copied</>
                        ) : (
                          <><Copy className="h-3.5 w-3.5" /> Copy</>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadPdf}
                        aria-label="Download PDF"
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur transition hover:border-primary/40 hover:text-primary"
                      >
                        <Download className="h-3.5 w-3.5" /> PDF
                      </button>
                    </div>
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
                    <div className="font-serif text-[1.35rem] leading-[2.1] text-foreground/90 sm:text-[1.5rem] sm:leading-[2.2]">
                      {currentChapter.verses.map((v) => {
                        const k = verseKey(currentChapter.chapter, v.verse);
                        const isHighlighted = !!highlights[k];
                        const isOpen = openVerse === v.verse;
                        const isActive = activeVerse?.verse === v.verse && showPanel;
                        return (
                          <span key={v.verse} className="relative">
                            <sup className="mr-1 select-none align-super text-[0.75rem] font-bold text-primary/70">
                              {v.verse}
                            </sup>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={() => setOpenVerse(isOpen ? null : v.verse)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setOpenVerse(isOpen ? null : v.verse);
                                }
                              }}
                              className={`cursor-pointer rounded transition ${
                                isHighlighted ? "bg-yellow-200/60 dark:bg-yellow-500/25 px-1" : ""
                              } ${isActive ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-card" : ""} hover:bg-primary/10`}
                            >
                              {v.text}
                            </span>
                            {isOpen && (
                              <span className="relative inline-block align-baseline">
                                <span className="absolute left-0 top-1 z-20 flex flex-wrap gap-1 rounded-lg border border-border bg-popover p-1.5 text-sm shadow-lg">
                                  <button
                                    onClick={() => {
                                      toggleHighlight(currentChapter.chapter, v.verse);
                                      setOpenVerse(null);
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-popover-foreground hover:bg-secondary"
                                  >
                                    <Highlighter className="h-3.5 w-3.5" />
                                    {isHighlighted ? "Unhighlight" : "Highlight"}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveVerse({ verse: v.verse, text: v.text });
                                      setPanelTab("compare");
                                      setOpenVerse(null);
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-popover-foreground hover:bg-secondary"
                                  >
                                    <Languages className="h-3.5 w-3.5" /> Compare
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveVerse({ verse: v.verse, text: v.text });
                                      setPanelTab("explain");
                                      setOpenVerse(null);
                                    }}
                                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-popover-foreground hover:bg-secondary"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" /> Explain
                                  </button>
                                </span>
                              </span>
                            )}
                            {" "}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <nav className="mt-8 flex items-center justify-between gap-3">
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
            </div>


            {showPanel && activeVerse && currentChapter && (
              <aside className="md:sticky md:top-20 md:self-start">
                <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setPanelTab("compare")}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          panelTab === "compare"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-primary/10"
                        }`}
                      >
                        <Languages className="h-3.5 w-3.5" /> Compare
                      </button>
                      <button
                        onClick={() => setPanelTab("explain")}
                        className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold ${
                          panelTab === "explain"
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground hover:bg-primary/10"
                        }`}
                      >
                        <Sparkles className="h-3.5 w-3.5" /> AI Explain
                      </button>
                    </div>
                    <button
                      onClick={closePanel}
                      aria-label="Close panel"
                      className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="border-b border-border bg-secondary/40 px-4 py-2 text-xs text-muted-foreground">
                    {localized} {currentChapter.chapter}:{activeVerse.verse}
                  </div>
                  <div className="max-h-[70vh] overflow-y-auto p-4">
                    {panelTab === "compare" ? (
                      <VerseComparePanel
                        book={bookName}
                        chapter={currentChapter.chapter}
                        verse={activeVerse.verse}
                      />
                    ) : (
                      <VerseExplainPanel
                        book={bookName}
                        chapter={currentChapter.chapter}
                        verse={activeVerse.verse}
                        text={activeVerse.text}
                        reference={`${localized} ${currentChapter.chapter}:${activeVerse.verse}`}
                      />
                    )}
                  </div>
                </div>
              </aside>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
