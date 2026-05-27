import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Users, Globe, BookOpen, FileQuestion, Loader2 } from "lucide-react";
import { adminService } from "@/services/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const CARDS = [
  { key: "total_users", label: "Total Users", icon: Users, to: "/admin/users", color: "text-blue-600" },
  { key: "total_languages", label: "Total Languages", icon: Globe, to: "/admin/languages", color: "text-emerald-600" },
  { key: "total_books", label: "Total Books", icon: BookOpen, to: "/admin/books", color: "text-amber-600" },
  { key: "total_questions", label: "Total Questions", icon: FileQuestion, to: "/admin/questions-import", color: "text-rose-600" },
] as const;

function AdminDashboard() {
  const stats = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => adminService.getStats(),
    retry: 0,
  });
  const activity = useQuery({
    queryKey: ["admin", "activity"],
    queryFn: () => adminService.getActivity(10),
    retry: 0,
  });

  const values: Record<string, number | string> = stats.data?.stats ?? {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-foreground">Dashboard</h2>
        <p className="text-sm text-muted-foreground">Overview of your platform.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.key}
              to={c.to}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{c.label}</span>
                <Icon className={`h-5 w-5 ${c.color}`} />
              </div>
              <div className="mt-3 text-3xl font-semibold text-foreground">
                {stats.isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : stats.isError ? (
                  "—"
                ) : (
                  values[c.key] ?? 0
                )}
              </div>
            </Link>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-4 font-serif text-lg font-semibold text-foreground">Recent Activity</h3>
        {activity.isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        ) : activity.isError ? (
          <p className="text-sm text-muted-foreground">No activity available yet.</p>
        ) : (activity.data?.activities ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        ) : (
          <ul className="divide-y divide-border">
            {activity.data!.activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3 text-sm">
                <span className="text-foreground">{a.message}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(a.created_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
