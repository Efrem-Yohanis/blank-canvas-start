import { audioService } from "@/services/api";

/**
 * Tracks chapter audio completions for the current device.
 * - Always written to localStorage so guests keep progress between sessions
 *   and on the same device after Google login.
 * - When a user is signed in, completions are also forwarded to the API.
 * - On login, pending completions are flushed to the server.
 */

type PendingItem = {
  book_id: number;
  chapter: number;
  language: string;
  at: number;
};

const PENDING_KEY = "bible.audioProgress.pending";
const LOCAL_KEY = "bible.audioProgress.local";

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

/** Read locally-tracked completed chapters for a book (works for guests). */
export function getLocalCompletedChapters(bookId: number): number[] {
  const map = readJSON<Record<string, number[]>>(LOCAL_KEY, {});
  return map[String(bookId)] ?? [];
}

function rememberLocal(bookId: number, chapter: number) {
  const map = readJSON<Record<string, number[]>>(LOCAL_KEY, {});
  const list = new Set(map[String(bookId)] ?? []);
  list.add(chapter);
  map[String(bookId)] = Array.from(list).sort((a, b) => a - b);
  writeJSON(LOCAL_KEY, map);
}

function queuePending(item: PendingItem) {
  const list = readJSON<PendingItem[]>(PENDING_KEY, []);
  // De-dup
  if (!list.some((p) => p.book_id === item.book_id && p.chapter === item.chapter)) {
    list.push(item);
    writeJSON(PENDING_KEY, list);
  }
}

/**
 * Record a chapter completion. If signed-in, sends to server immediately;
 * otherwise stores locally and queues to be synced after login.
 */
export async function recordChapterCompletion(opts: {
  bookId: number;
  chapter: number;
  language: string;
  isAuthenticated: boolean;
}) {
  const { bookId, chapter, language, isAuthenticated } = opts;
  rememberLocal(bookId, chapter);
  if (!isAuthenticated) {
    queuePending({ book_id: bookId, chapter, language, at: Date.now() });
    return;
  }
  try {
    await audioService.recordCompletion(bookId, chapter, language);
  } catch {
    // network/auth issue — queue for later sync
    queuePending({ book_id: bookId, chapter, language, at: Date.now() });
  }
}

/** Flush queued completions to the server. Call after login. */
export async function syncPendingProgress() {
  const list = readJSON<PendingItem[]>(PENDING_KEY, []);
  if (list.length === 0) return;
  const remaining: PendingItem[] = [];
  for (const item of list) {
    try {
      await audioService.recordCompletion(item.book_id, item.chapter, item.language);
    } catch {
      remaining.push(item);
    }
  }
  writeJSON(PENDING_KEY, remaining);
}