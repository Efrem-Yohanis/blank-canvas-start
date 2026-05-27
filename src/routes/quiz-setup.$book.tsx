import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Sparkles, Check, AlertCircle, ChevronDown } from "lucide-react";
import { Header } from "@/components/Header";
import { useI18n } from "@/lib/i18n";
import { bibleService, quizService, type QuizLevel } from "@/services/api";
import { useAuth } from "@/lib/auth";
import { findBook, localizedBookName } from "@/data/bible";

export const Route = createFileRoute("/quiz-setup/$book")({
  head: () => ({ meta: [{ title: "Choose Level — Bible Quiz" }] }),
  component: QuizSetupPage,
});

function QuizSetupPage() {
  const { book: slug } = Route.useParams();
  const { lang, languageId, languages } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();

  const bookName = findBook(slug)?.name ?? slug.replace(/-/g, " ");
  const localized = localizedBookName(bookName, lang);

  // Resolve book_id from the books-by-language endpoint
  const booksQ = useQuery({
    queryKey: ["bible-books-by-language", lang],
    queryFn: () => bibleService.getBooksByLanguage(lang),
    staleTime: 1000 * 60 * 10,
  });

  const bookId =
    booksQ.data?.books.find(
      (b) => b.name.toLowerCase() === bookName.toLowerCase(),
    )?.id ?? null;

  const levelsQ = useQuery({
    queryKey: ["quiz-levels", bookId],
    queryFn: () => quizService.getLevels(bookId as number),
    enabled: !!bookId,
    staleTime: 1000 * 60 * 10,
  });

  const levels: QuizLevel[] = levelsQ.data?.data.levels ?? [];
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStart = async () => {
    setStartError(null);
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!bookId || !selectedLevel || !languageId) {
      setStartError("Missing book, level, or language selection.");
      return;
    }
    try {
      setStarting(true);
      await quizService.start(bookId, selectedLevel, languageId);
      navigate({
        to: "/quiz/$book",
        params: { book: slug },
        search: { book_id: bookId, level_id: selectedLevel, language_id: languageId },
      });
    } catch (e) {
      setStartError((e as Error).message || "Failed to start quiz.");
    } finally {
      setStarting(false);
    }
  };

  const loading = booksQ.isLoading || levelsQ.isLoading;
  const error =
    booksQ.error?.message || levelsQ.error?.message || (bookId === null && !booksQ.isLoading ? "Book not found." : null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary/30 via-background to-background">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <Link
          to="/book/$book"
          params={{ book: slug }}
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to {localized}
        </Link>

        <header className="mb-8 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Quiz Setup
          </p>
          <h1 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-5xl">
            {localized}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a difficulty level to begin your quiz.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Language:{" "}
            <span className="font-medium text-foreground">
              {languages.find((l) => l.code === lang)?.native_name ?? lang}
            </span>
          </p>
        </header>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-44 animate-pulse rounded-2xl border border-border/60 bg-card"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}
          </div>
        ) : levels.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">
            No quiz levels available for this book yet.
          </p>
        ) : (
          <>
            <LevelDropdown
              levels={levels}
              selectedId={selectedLevel}
              onSelect={setSelectedLevel}
            />

            {startError && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /> {startError}
              </div>
            )}

            <div className="mt-8 flex flex-col items-center gap-3">
              <button
                onClick={handleStart}
                disabled={!selectedLevel || starting || !languageId}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {starting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Starting…
                  </>
                ) : (
                  <>Start Quiz</>
                )}
              </button>
              {!user && (
                <p className="text-xs text-muted-foreground">
                  You will be asked to log in.
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function LevelDropdown({
  levels,
  selectedId,
  onSelect,
}: {
  levels: QuizLevel[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = levels.find((l) => l.level_id === selectedId) ?? null;

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <div className="mx-auto w-full max-w-md" ref={ref}>
      <label className="mb-2 block text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        Difficulty Level
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left shadow-sm transition hover:border-primary/40"
        >
          {selected ? (
            <>
              <span
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"
                style={{ backgroundColor: `${selected.color}25`, color: selected.color }}
              >
                {selected.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-serif text-base font-semibold text-foreground">
                    {selected.name}
                  </span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                    style={{ backgroundColor: `${selected.color}20`, color: selected.color }}
                  >
                    Lv {selected.level_number}
                  </span>
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {selected.description}
                </span>
              </span>
            </>
          ) : (
            <span className="flex-1 text-sm text-muted-foreground">
              Choose a difficulty…
            </span>
          )}
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-muted-foreground transition ${open ? "rotate-180" : ""}`}
          />
        </button>

        {open && (
          <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-xl">
            <ul className="max-h-80 overflow-y-auto py-1">
              {levels.map((lvl) => {
                const active = selectedId === lvl.level_id;
                return (
                  <li key={lvl.level_id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(lvl.level_id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-secondary ${
                        active ? "bg-secondary/70" : ""
                      }`}
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl"
                        style={{ backgroundColor: `${lvl.color}25`, color: lvl.color }}
                      >
                        {lvl.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-serif text-sm font-semibold text-foreground">
                            {lvl.name}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
                            style={{ backgroundColor: `${lvl.color}20`, color: lvl.color }}
                          >
                            Lv {lvl.level_number}
                          </span>
                        </span>
                        <span className="line-clamp-1 text-xs text-muted-foreground">
                          {lvl.description}
                        </span>
                      </span>
                      {active && (
                        <Check className="h-4 w-4 shrink-0" style={{ color: lvl.color }} />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
