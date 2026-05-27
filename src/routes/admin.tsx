import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Globe, BookOpen, BookText, FileQuestion,
  LogOut, Bell, Settings as SettingsIcon, User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — Bible Quiz" }] }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/languages", label: "Languages", icon: Globe },
  { to: "/admin/books", label: "Books", icon: BookOpen },
  { to: "/admin/bible-import", label: "Bible Import", icon: BookText },
  { to: "/admin/questions-import", label: "Questions Import", icon: FileQuestion },
] as const;

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + "/");

  return (
    <div className="flex min-h-screen bg-secondary/40">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[oklch(0.22_0.03_260)] text-white md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-white/10 px-5 font-serif text-lg font-semibold">
          <BookOpen className="h-5 w-5" /> Bible Admin
        </div>
        <nav className="flex-1 space-y-1 p-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.to, "exact" in item ? item.exact : false);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => {
            logout();
            navigate({ to: "/login" });
          }}
          className="m-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur md:px-8">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="font-serif text-base font-semibold text-foreground">
              {user?.name ?? "Admin"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <IconBtn label="Notifications"><Bell className="h-4 w-4" /></IconBtn>
            <IconBtn label="Settings"><SettingsIcon className="h-4 w-4" /></IconBtn>
            <IconBtn label="Profile"><UserIcon className="h-4 w-4" /></IconBtn>
          </div>
        </header>

        <main className="px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function IconBtn({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-secondary"
    >
      {children}
    </button>
  );
}
