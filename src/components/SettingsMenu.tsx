import { useEffect, useRef, useState } from "react";
import { Settings as SettingsIcon, Sun, Moon, Monitor, Type, ALargeSmall } from "lucide-react";
import { useSettings, type FontSize, type FontFamily, type Theme } from "@/lib/settings";

export function SettingsMenu() {
  const { fontSize, fontFamily, theme, setFontSize, setFontFamily, setTheme } = useSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const sizes: { v: FontSize; label: string }[] = [
    { v: "sm", label: "S" },
    { v: "base", label: "M" },
    { v: "lg", label: "L" },
    { v: "xl", label: "XL" },
  ];
  const fonts: { v: FontFamily; label: string }[] = [
    { v: "serif", label: "Serif" },
    { v: "sans", label: "Sans" },
    { v: "inter", label: "Inter" },
    { v: "merriweather", label: "Merriweather" },
    { v: "mono", label: "Mono" },
  ];
  const themes: { v: Theme; label: string; Icon: typeof Sun }[] = [
    { v: "light", label: "Light", Icon: Sun },
    { v: "dark", label: "Dark", Icon: Moon },
    { v: "system", label: "System", Icon: Monitor },
  ];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-foreground hover:bg-secondary"
        aria-label="Settings"
      >
        <SettingsIcon className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 rounded-xl border border-border bg-popover p-4 shadow-lg z-40">
          <div className="mb-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ALargeSmall className="h-3.5 w-3.5" /> Font size
            </div>
            <div className="flex gap-1.5">
              {sizes.map((s) => (
                <button
                  key={s.v}
                  onClick={() => setFontSize(s.v)}
                  className={`flex-1 rounded-md border px-2 py-1.5 text-sm font-medium ${
                    fontSize === s.v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Type className="h-3.5 w-3.5" /> Font style
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {fonts.map((f) => (
                <button
                  key={f.v}
                  onClick={() => setFontFamily(f.v)}
                  className={`rounded-md border px-2 py-1.5 text-sm ${
                    fontFamily === f.v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Theme
            </div>
            <div className="flex gap-1.5">
              {themes.map(({ v, label, Icon }) => (
                <button
                  key={v}
                  onClick={() => setTheme(v)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-md border px-2 py-1.5 text-sm ${
                    theme === v
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
