# Plan: Settings + Interactive Verses + AI Explanation

## 1. Settings system

Create a `SettingsProvider` (`src/lib/settings.tsx`) that persists to `localStorage`:
- `fontSize`: `sm | base | lg | xl` (applied as CSS variable `--app-font-scale` on `<html>`)
- `fontFamily`: `serif | sans | mono | inter | merriweather` (CSS variable `--app-font-family`)
- `theme`: `light | dark | system` (toggles `dark` class on `<html>`)

Wire provider in `src/routes/__root.tsx`. Add a `Settings` icon (gear) button in `src/components/Header.tsx` opening a dropdown/sheet with three controls.

Apply the CSS variables globally in `src/styles.css` so all pages inherit. Add `.dark` token overrides if not already present (verify in styles.css).

## 2. Clickable verses on book page

In `src/routes/book.$book.tsx`:
- Replace the inline span rendering with a `<VerseSpan>` component per verse.
- Track `selectedVerse: {chapter, verse} | null` and `highlighted: Set<string>` (persisted to localStorage per book).
- Clicking a verse opens a small popover near it with actions:
  - **Highlight / Unhighlight**
  - **Compare languages** → opens right-side panel
  - **Explain with AI** → opens right-side panel

Layout shifts to a two-column when a panel is open: main text on left, panel on right (sticky). On small screens the panel becomes a bottom sheet.

## 3. Right-side panel: Compare languages

New component `VerseComparePanel`:
- Uses existing `bibleService.getLanguages()` (or `useI18n().languages`) to fetch all available languages.
- For each language, calls `bibleService.getChapter(bookName, chapter, langCode)` and shows the matching verse number.
- Loads in parallel with `useQueries`; shows each translation in a stacked list with language name + verse text.

## 4. Right-side panel: AI explanation

New TanStack server route `src/routes/api/verse-explain.ts` (POST):
- Input: `{ book, chapter, verse, text, reference, language }`
- Calls Lovable AI Gateway (`google/gemini-3-flash-preview`) with a system prompt asking for a deep, faith-respectful explanation in the user's UI language.
- Streams SSE response back.

Client component `VerseExplainPanel` streams tokens and renders with `react-markdown` (already? if not add `bun add react-markdown`). Handles 429/402 errors with a toast.

Requires `LOVABLE_API_KEY` — check via `fetch_secrets`; if missing call `ai_gateway--create`.

## 5. Multilingual consistency

The compare/AI panels both honor the current `lang` from `useI18n()`. The AI prompt instructs replies in that language. Questions page (`quiz.$book.tsx`) already passes `language` to the quiz API — no change needed beyond confirming.

## Files to create
- `src/lib/settings.tsx`
- `src/components/SettingsMenu.tsx`
- `src/components/VersePopover.tsx`
- `src/components/VerseComparePanel.tsx`
- `src/components/VerseExplainPanel.tsx`
- `src/routes/api/verse-explain.ts`

## Files to edit
- `src/routes/__root.tsx` (wrap SettingsProvider)
- `src/components/Header.tsx` (add Settings icon)
- `src/styles.css` (font-scale + font-family CSS vars, dark theme tokens if missing)
- `src/routes/book.$book.tsx` (clickable verses, panels, highlight persistence)

## Out of scope
- Server-side persistence of highlights (kept in localStorage only)
- Per-verse comments/notes
- Changing the quiz page UI (multilingual is already supported)
