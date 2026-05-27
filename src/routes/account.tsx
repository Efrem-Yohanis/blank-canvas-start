import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "My Account — Scripture" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, results } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const booksRead = Array.from(new Set(results.map((r) => r.book)));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="mb-8 rounded-2xl border border-border bg-card p-6">
          <p className="text-sm uppercase tracking-wider text-muted-foreground">Account</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-foreground">{user.name}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">Books explored</h2>
          {booksRead.length === 0 ? (
            <p className="text-sm text-muted-foreground">No quizzes taken yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {booksRead.map((b) => (
                <span key={b} className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-foreground">
                  {b}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-3 font-serif text-xl font-semibold text-foreground">Quiz history</h2>
          {results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              Take your first quiz to see it here.
              <div className="mt-3">
                <Link to="/" className="rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">
                  Browse books
                </Link>
              </div>
            </div>
          ) : (
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {results.map((r, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-card-foreground">{r.book}</div>
                    <div className="text-xs text-muted-foreground">
                      Level {r.level} · {new Date(r.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-serif text-lg font-semibold text-foreground tabular-nums">
                    {r.score}/{r.total}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}