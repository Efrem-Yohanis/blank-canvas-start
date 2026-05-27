import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BookMarked, Play, PlayCircle, KeyRound, Pencil } from "lucide-react";
import { ProtectedPage, StatCard, SectionCard } from "@/components/ProtectedPage";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { userService } from "@/services/api";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — Bible Quiz" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();

  const profileQ = useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => userService.getProfile(),
    enabled: !!user,
  });
  const statsQ = useQuery({
    queryKey: ["user", "stats"],
    queryFn: () => userService.getStats(),
    enabled: !!user,
  });
  const historyQ = useQuery({
    queryKey: ["user", "history", 100],
    queryFn: () => userService.getQuizHistory(100),
    enabled: !!user,
  });
  const inProgress = useQuery({
    queryKey: ["user", "in-progress"],
    queryFn: () => userService.getInProgressQuizzes(),
    enabled: !!user,
  });

  const p: any = profileQ.data?.user;
  const s: any = statsQ.data?.stats ?? {};
  const items = historyQ.data?.history ?? [];
  const quizzes = inProgress.data?.quizzes ?? [];

  const accuracy = s.total_questions_answered
    ? Math.round((s.total_correct_answers / s.total_questions_answered) * 100)
    : 0;
  const avgScore = items.length
    ? Math.round(items.reduce((a, b) => a + (b.score_percentage ?? 0), 0) / items.length)
    : 0;
  const best = items.length
    ? `${Math.round(Math.max(...items.map((i) => i.score_percentage)))}%`
    : "—";
  const byBook = useMemo(
    () =>
      items.reduce<Record<string, typeof items>>((acc, x) => {
        (acc[x.book_name] ||= []).push(x);
        return acc;
      }, {}),
    [items]
  );

  const [bookFilter, setBookFilter] = useState<string>("all");
  const allBooks = useMemo(() => Object.keys(byBook), [byBook]);
  const filteredHistory = useMemo(
    () => (bookFilter === "all" ? items : items.filter((i) => i.book_name === bookFilter)),
    [items, bookFilter]
  );

  return (
    <ProtectedPage>
      <h1 className="mb-1 font-serif text-3xl font-semibold text-foreground">
        Welcome back, {p?.username ?? user?.name}
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Your profile and learning at a glance.</p>

      {/* Account info */}
      <SectionCard
        title="Account information"
        action={
          <div className="flex gap-2">
            <Link
              to="/profile/edit"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
            <Link
              to="/profile/change-password"
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary"
            >
              <KeyRound className="h-3.5 w-3.5" /> Password
            </Link>
          </div>
        }
      >
        {profileQ.isLoading ? (
          <Skeleton className="h-24" />
        ) : (
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Row label="Username" value={p?.username ?? user?.name ?? "—"} />
            <Row label="Email" value={p?.email ?? user?.email ?? "—"} />
            <Row
              label="Member since"
              value={p?.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
            />
          </dl>
        )}
      </SectionCard>

      {/* Overall statistics */}
      <SectionCard title="Overall">
        {statsQ.isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Quizzes" value={s.total_quizzes_taken ?? 0} />
            <StatCard label="Correct" value={s.total_correct_answers ?? 0} />
            <StatCard label="Answered" value={s.total_questions_answered ?? 0} />
            <StatCard label="Accuracy" value={`${accuracy}%`} />
            <StatCard
              label="Wrong"
              value={(s.total_questions_answered ?? 0) - (s.total_correct_answers ?? 0)}
            />
            <StatCard label="Avg score" value={`${avgScore}%`} />
            <StatCard label="Best" value={best} />
            <StatCard label="Books played" value={allBooks.length} />
          </div>
        )}
      </SectionCard>

      {/* Performance by book */}
      <SectionCard title="Performance by book">
        {historyQ.isLoading ? (
          <Skeleton className="h-32" />
        ) : allBooks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No completed quizzes yet.</p>
        ) : (
          <ul className="space-y-3">
            {Object.entries(byBook).map(([book, list]) => {
              const avg = Math.round(
                list.reduce((a, b) => a + b.score_percentage, 0) / list.length
              );
              return (
                <li key={book}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{book}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {avg}% · {list.length} quiz{list.length > 1 ? "es" : ""}
                    </span>
                  </div>
                  <Progress value={avg} className="h-1.5" />
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Explore */}
      <SectionCard title="Explore">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
          <QuickLink to="/" icon={<Play className="h-5 w-5" />} label="Start quiz" />
          <QuickLink
            to="/reading-progress"
            icon={<BookMarked className="h-5 w-5" />}
            label="Reading Bible"
          />
        </div>
      </SectionCard>

      {/* In-progress quizzes */}
      <SectionCard title={`In progress quizzes (${quizzes.length})`}>
        {inProgress.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No quizzes in progress. Start one to see it here.
          </p>
        ) : (
          <ul className="space-y-3">
            {quizzes.map((q: any) => {
              const total = q.total_questions ?? 10;
              const current =
                q.current_question_number ??
                q.answered_questions ??
                q.questions_answered ??
                0;
              const pct = Math.min(100, Math.round((current / total) * 100));
              return (
                <li
                  key={q.attempt_id ?? q.id}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {q.book_name ?? q.book ?? "Quiz"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {q.level ?? q.level_name ?? q.level_id ?? "—"}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Progress value={pct} className="h-1.5" />
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {current}/{total}
                      </span>
                    </div>
                  </div>
                  <Link
                    to="/quiz/$book"
                    params={{ book: String(q.book_name ?? q.book ?? "") }}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> Resume
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </SectionCard>

      {/* Quiz history */}
      <SectionCard
        title={`Quiz history (${filteredHistory.length})`}
        action={
          allBooks.length > 0 ? (
            <select
              value={bookFilter}
              onChange={(e) => setBookFilter(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">All books</option>
              {allBooks.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          ) : null
        }
      >
        {historyQ.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : filteredHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">No quizzes yet. Take one to see it here.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Book</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Questions</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {filteredHistory.map((q) => (
                  <tr key={q.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4 text-muted-foreground">
                      {q.completed_at ? new Date(q.completed_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-foreground">{q.book_name}</td>
                    <td className="py-2.5 pr-4 tabular-nums">
                      {Math.round(q.score_percentage)}%
                    </td>
                    <td className="py-2.5 pr-4 tabular-nums text-muted-foreground">
                      {q.correct_answers}/{q.total_questions}
                    </td>
                    <td className="py-2.5 text-right">
                      <Link
                        to="/quiz/$book"
                        params={{ book: q.book_name }}
                        className="text-xs text-primary hover:underline"
                      >
                        Retry
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
    </ProtectedPage>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-foreground">{value}</dd>
    </div>
  );
}

function QuickLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-start gap-2 rounded-xl border border-border bg-card p-4 transition-colors hover:bg-secondary"
    >
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </Link>
  );
}
