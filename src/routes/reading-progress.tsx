import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProtectedPage, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { bibleService, userService } from "@/services/api";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/reading-progress")({
  head: () => ({ meta: [{ title: "Reading progress — Bible Quiz" }] }),
  component: ReadingProgressPage,
});

function ReadingProgressPage() {
  const { lang } = useI18n();
  const books = useQuery({
    queryKey: ["bible", "books-by-lang", lang],
    queryFn: () => bibleService.getBooksByLanguage(lang),
  });

  const complete = useQuery({
    queryKey: ["user", "complete-profile"],
    queryFn: () => userService.getCompleteProfile(),
  });

  // best-effort: api shape varies. Try common keys.
  const progressMap: Record<string, { chapter?: number }> =
    (complete.data?.profile?.book_progress as any) ??
    (complete.data?.profile?.progress as any) ??
    {};

  const all = books.data?.books ?? [];
  const old = all.filter((b) => b.testament === "Old");
  const nt = all.filter((b) => b.testament === "New");

  if (books.isLoading) {
    return (
      <ProtectedPage>
        <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Reading progress</h1>
        <Skeleton className="mb-4 h-64" />
        <Skeleton className="h-64" />
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <h1 className="mb-6 font-serif text-3xl font-semibold text-foreground">Reading progress</h1>

      <SectionCard title="Old Testament">
        <BookList books={old} progressMap={progressMap} />
      </SectionCard>

      <SectionCard title="New Testament">
        <BookList books={nt} progressMap={progressMap} />
      </SectionCard>
    </ProtectedPage>
  );
}

function BookList({
  books,
  progressMap,
}: {
  books: { id: number; name: string; chapters: number }[];
  progressMap: Record<string, { chapter?: number }>;
}) {
  if (books.length === 0) return <p className="text-sm text-muted-foreground">No books available.</p>;
  return (
    <ul className="space-y-3">
      {books.map((b) => {
        const current = progressMap[b.name]?.chapter ?? 0;
        const pct = b.chapters ? Math.round((current / b.chapters) * 100) : 0;
        return (
          <li key={b.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{b.name}</span>
                <span className="tabular-nums text-muted-foreground">
                  {current}/{b.chapters} ({pct}%)
                </span>
              </div>
              <Progress value={pct} className="h-1.5" />
            </div>
            <Link
              to="/book/$book"
              params={{ book: b.name }}
              className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              {current > 0 ? "Continue" : "Start"}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
