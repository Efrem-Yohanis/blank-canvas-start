import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Loader2, BookOpen, ArrowRight, TextSearch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { useI18n } from "@/lib/i18n";
import { bibleService } from "@/services/api";
import { bookSlug, localizedBookName } from "@/data/bible";

type ApiBook = { id: number; name: string; testament: "Old" | "New"; chapters: number };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bible Quiz — Read & Test Your Knowledge" },
      { name: "description", content: "Read the Bible and test your knowledge with quizzes in multiple languages." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState("");

  const booksQ = useQuery({
    queryKey: ["bible-books-by-language", lang],
    queryFn: () => bibleService.getBooksByLanguage(lang),
    staleTime: 1000 * 60 * 10,
    retry: 1,
  });

  const books: ApiBook[] = booksQ.data?.books ?? [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => {
      const localized = localizedBookName(b.name, lang).toLowerCase();
      return b.name.toLowerCase().includes(q) || localized.includes(q);
    });
  }, [books, query, lang]);

  const oldBooks = filtered.filter((b) => b.testament === "Old");
  const newBooks = filtered.filter((b) => b.testament === "New");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <VerseOfTheDay />
        <section className="mb-8 text-center">
          <p className="text-sm font-medium uppercase tracking-wider text-primary">
            {t.booksCount(books.length || 66)}
          </p>
          <h1 className="mt-2 font-serif text-4xl font-semibold text-foreground sm:text-5xl">
            {t.appName}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">{t.tagline}</p>
          <p className="mx-auto mt-1 max-w-xl text-sm text-muted-foreground">{t.chooseBook}</p>
          <div className="mx-auto mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
                className="w-full rounded-full border border-border bg-card py-3 pl-11 pr-4 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <Link
              to="/search"
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary/40 hover:text-primary"
            >
              <TextSearch className="h-4 w-4" /> Search verses
            </Link>
          </div>
        </section>

        {booksQ.isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading books…
          </div>
        ) : booksQ.isError ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-center text-sm text-destructive">
            Failed to load books. {(booksQ.error as Error)?.message}
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-muted-foreground">{t.noResults}</p>
        ) : (
          <div className="space-y-10">
            {oldBooks.length > 0 && (
              <TestamentSection title={t.oldTestament} books={oldBooks} lang={lang} />
            )}
            {newBooks.length > 0 && (
              <TestamentSection title={t.newTestament} books={newBooks} lang={lang} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function TestamentSection({ title, books, lang }: { title: string; books: ApiBook[]; lang: string }) {
  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between border-b border-border pb-2">
        <h2 className="font-serif text-2xl font-semibold text-foreground">{title}</h2>
        <span className="text-sm text-muted-foreground">{books.length}</span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((b, i) => (
          <BookCard key={b.id} index={i} book={b} lang={lang} />
        ))}
      </div>
    </section>
  );
}

function BookCard({ index, book, lang }: { index: number; book: ApiBook; lang: string }) {
  const slug = bookSlug(book.name);
  const localized = localizedBookName(book.name, lang);

  return (
    <Link
      to="/book/$book"
      params={{ book: slug }}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-semibold text-primary/70">#{index + 1}</div>
          <h3 className="font-serif text-xl font-semibold text-card-foreground">{localized}</h3>
          {localized !== book.name && (
            <p className="text-xs text-muted-foreground">{book.name}</p>
          )}
        </div>
        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
          <BookOpen className="h-3 w-3" /> {book.chapters} {t_chapters_label(book.chapters)}
        </span>
      </div>

      <p className="mt-3 text-xs text-muted-foreground">
        {book.testament === "Old" ? "Old Testament" : "New Testament"}
      </p>

      <div className="mt-4 flex items-center justify-end gap-1 text-sm font-medium text-primary transition group-hover:gap-2">
        Open <ArrowRight className="h-4 w-4" />
      </div>
    </Link>
  );
}

function t_chapters_label(n: number) {
  return n === 1 ? "chapter" : "chapters";
}