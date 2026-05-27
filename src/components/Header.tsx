import { Link } from "@tanstack/react-router";
import { BookOpen, User as UserIcon, LogOut, Globe, Check } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useI18n, LANGS } from "@/lib/i18n";

export function Header() {
  const { user, logout } = useAuth();
  const { lang, setLang, t, languages, languagesLoading } = useI18n();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Use API languages when available, otherwise fall back to bundled list
  const langOptions = languages.length > 0
    ? languages.map((l) => ({ code: l.code, label: l.name, native: l.native_name }))
    : LANGS.map((l) => ({ code: l.code, label: l.label, native: l.native }));
  const current = langOptions.find((l) => l.code === lang);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-serif text-lg font-semibold text-foreground">
          <BookOpen className="h-5 w-5 text-primary" />
          {t.appName}
        </Link>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              onClick={() => setLangOpen((o) => !o)}
              className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
              aria-label={t.language}
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {languagesLoading && !current ? "…" : current?.native ?? lang}
              </span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-lg z-40">
                {langOptions.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => {
                      setLang(l.code);
                      setLangOpen(false);
                    }}
                    className="flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm text-popover-foreground hover:bg-secondary"
                  >
                    <span>
                      <span className="font-medium">{l.native}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{l.label}</span>
                    </span>
                    {lang === l.code && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
          {user ? (
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-secondary"
            >
              <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs">
                {user.name[0]}
              </span>
              {user.name}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              {t.login}
            </Link>
          )}
          {user && open && (
            <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
              <Link to="/profile" onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-popover-foreground hover:bg-secondary">
                <UserIcon className="h-4 w-4" /> Profile
              </Link>
              <button
                onClick={() => {
                  setOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 border-t border-border px-4 py-2 text-left text-sm text-popover-foreground hover:bg-secondary"
              >
                <LogOut className="h-4 w-4" /> {t.logout}
              </button>
            </div>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}