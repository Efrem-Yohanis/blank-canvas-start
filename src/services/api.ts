// API base URL — Bible Quiz backend
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "https://bibel-quiz.onrender.com";

const TOKEN_KEY = "bible.token";

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export async function apiClient<T>(
  url: string,
  method: string = "GET",
  body: unknown = null,
  token: string | null = null
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const authToken = token ?? getToken();
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_BASE_URL}${url}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => null);

  // Some endpoints (e.g. /api/auth/login) return HTTP 200 but with an
  // error envelope: `[{status:"error", message, data}, <httpCode>]`.
  // Detect and surface as ApiError so callers don't treat it as success.
  if (Array.isArray(data) && data.length === 2 && typeof data[1] === "number") {
    const [body, code] = data as [any, number];
    if (code >= 400 || body?.status === "error") {
      const message = body?.message || body?.error || `HTTP ${code}`;
      throw new ApiError(message, code, body);
    }
  }

  if (!response.ok) {
    const message =
      (data as any)?.message || (data as any)?.error || `HTTP ${response.status}`;
    throw new ApiError(message, response.status, data);
  }
  return data as T;
}

// ───────────────────────── Auth ─────────────────────────
export const authService = {
  register: (email: string, password: string, username: string) =>
    apiClient<{ success: boolean; token: string; user: { id: number; username: string; email: string } }>(
      "/api/auth/register",
      "POST",
      { email, password, username }
    ),
  login: (email: string, password: string) =>
    apiClient<{ success: boolean; token: string; user: { id: number; username: string; email: string } }>(
      "/api/auth/login",
      "POST",
      // Backend requires `username` (accepts email or username value).
      { username: email, email, password }
    ),
  googleLoginUrl: (redirectUri: string) =>
    `${API_BASE_URL}/api/auth/google/login?redirect_uri=${encodeURIComponent(redirectUri)}`,
};

// ───────────────────────── User / Profile ─────────────────────────
export type UserProfile = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  total_quizzes_taken: number;
  total_correct_answers: number;
  total_questions_answered: number;
};

export type QuizHistoryEntry = {
  id: number;
  book_name: string;
  total_questions: number;
  correct_answers: number;
  score_percentage: number;
  completed_at: string;
};

export const userService = {
  getProfile: () => apiClient<{ success: boolean; user: UserProfile }>("/api/users/profile"),

  getCompleteProfile: () =>
    apiClient<{ success: boolean; profile: any }>("/api/users/profile/complete"),

  getSummary: () =>
    apiClient<{
      success: boolean;
      profile: {
        user: UserProfile;
        statistics: Record<string, number>;
        can_resume: boolean;
        recent_activity: any[];
        in_progress_count: number;
      };
    }>("/api/users/profile/summary"),

  updateProfile: (data: { username?: string; email?: string }) =>
    apiClient<{ success: boolean; message: string; user: UserProfile }>(
      "/api/users/profile",
      "PUT",
      data
    ),

  changePassword: (data: { current_password: string; new_password: string }) =>
    apiClient<{ success: boolean; message: string }>(
      "/api/users/change-password",
      "POST",
      data
    ),

  getStats: () =>
    apiClient<{ success: boolean; stats: Record<string, number> }>("/api/users/stats"),

  getQuizHistory: (limit = 20) =>
    apiClient<{ success: boolean; history: QuizHistoryEntry[]; total: number }>(
      `/api/users/quiz-history?limit=${limit}`
    ),

  getInProgressQuizzes: () =>
    apiClient<{ success: boolean; quizzes: any[] }>("/api/users/in-progress-quizzes"),

  getBookProgress: (bookName: string) =>
    apiClient<{ success: boolean; progress: any }>(
      `/api/users/progress/${encodeURIComponent(bookName)}`
    ),

  updateProgress: (data: {
    book_name: string;
    chapter: number;
    verse: number;
    testament: "Old" | "New";
  }) =>
    apiClient<{ success: boolean; message: string }>(
      "/api/users/update-progress",
      "POST",
      data
    ),
};

// ───────────────────────── Quiz ─────────────────────────
export type QuizLanguage = {
  language_id: number;
  code: string;
  name: string;
  native_name: string;
};

export type QuizBook = {
  book_id: number;
  name: string;
  total_questions: number;
  levels: { level_id: number; name: string; question_count: number }[];
};

export type QuizQuestion = {
  question_id: number;
  text: string;
  verse_reference: string;
  options: { label: string; text: string }[];
};

export type QuizAttempt = {
  attempt_id: number;
  book_id: number;
  level_id: number;
  language_id: number;
  total_questions: number;
  current_question_number: number;
  status: string;
};

export type AnswerResult = {
  is_correct: boolean;
  selected_option: string;
  correct_option: { label: string; text: string };
  verse_reference?: string;
  verse_text?: string;
  explanation?: string;
  progress: { current: number; total: number; remaining: number };
  next_available: boolean;
  quiz_completed?: boolean;
  final_score?: {
    score_percentage: number;
    correct_answers: number;
    wrong_answers: number;
    total_questions: number;
  };
};

export type QuizLevel = {
  level_id: number;
  level_number: number;
  name: string;
  description: string;
  color: string;
  icon: string;
};

export const quizService = {
  getLanguages: () =>
    apiClient<{ success: boolean; data: QuizLanguage[] }>("/api/quiz/languages"),

  getBooks: () =>
    apiClient<{ success: boolean; data: QuizBook[] }>("/api/quiz/books"),

  getLevels: (book_id: number) =>
    apiClient<{
      success: boolean;
      data: { book_id: number; book_name: string; levels: QuizLevel[] };
    }>(`/api/quiz/books/${book_id}/levels`),

  start: (book_id: number, level_id: number, language_id: number) =>
    apiClient<{ success: boolean; data: QuizAttempt }>(
      "/api/quiz/quiz/start",
      "POST",
      { book_id, level_id, language_id }
    ),

  next: (attempt_id: number) =>
    apiClient<{
      success: boolean;
      data:
        | {
            attempt_id: number;
            question_number: number;
            remaining_questions: number;
            question: QuizQuestion;
          }
        | { completed: true; message: string };
    }>(`/api/quiz/quiz/${attempt_id}/next`),

  answer: (attempt_id: number, question_id: number, selected_option: string) =>
    apiClient<{ success: boolean; data: AnswerResult }>(
      "/api/quiz/quiz/answer",
      "POST",
      { attempt_id, question_id, selected_option }
    ),

  finish: (attempt_id: number) =>
    apiClient<{
      success: boolean;
      data: {
        attempt_id: number;
        score_percentage: number;
        correct_answers: number;
        wrong_answers: number;
        total_questions: number;
        status: string;
      };
    }>(`/api/quiz/quiz/${attempt_id}/finish`, "POST"),

  review: (attempt_id: number) =>
    apiClient<{
      success: boolean;
      data: {
        attempt_id: number;
        summary: {
          score_percentage: number;
          correct_answers: number;
          wrong_answers: number;
          total_questions: number;
        };
        questions: {
          question_id: number;
          question: string;
          selected_option: string;
          correct_option: string;
          is_correct: boolean;
          verse_reference: string;
          explanation: string;
        }[];
      };
    }>(`/api/quiz/quiz/${attempt_id}/review`),
};

// ───────────────────────── Bible (existing) ─────────────────────────
export type Testament = "Old" | "New";
export type BibleBook = { id: number; name: string; chapters_count: number };
export type BibleVerse = { verse: number; text: string };
export type GetBooksResponse = { books: BibleBook[] };
export type ChaptersResponse = {
  book: string;
  chapters: number[];
  total_chapters: number;
  status: string;
};
export type ChapterContentResponse = {
  book: string;
  chapter: number;
  language: string;
  status: string;
  verses: BibleVerse[];
};
export type VerseResponse = {
  book: string;
  chapter: number;
  verse: number;
  text: string;
  language: string;
  status: string;
};
export type FullBookResponse = {
  book: string;
  chapters: { chapter: number; verses: BibleVerse[] }[];
};

export const removeDuplicateVerses = (verses: BibleVerse[]): BibleVerse[] => {
  const seen = new Set<number>();
  return verses.filter((v) => {
    if (seen.has(v.verse)) return false;
    seen.add(v.verse);
    return true;
  });
};

export const bibleService = {
  getLanguages: () =>
    apiClient<{ status: string; data: { id: number; code: string; name: string; native_name: string }[] }>(
      "/api/bible/languages"
    ),

  getVerseOfTheDay: (lang: string) =>
    apiClient<{
      status: string;
      data: { reference: string; book: string; chapter: number; verse: number; text: string };
    }>(`/api/bible/verse-of-the-day?language=${encodeURIComponent(lang)}`),

  search: (q: string, lang: string, limit = 50) =>
    apiClient<{
      status: string;
      query: string;
      total: number;
      results: { reference: string; book: string; chapter: number; verse: number; text: string }[];
    }>(`/api/bible/search?q=${encodeURIComponent(q)}&language=${encodeURIComponent(lang)}&limit=${limit}`),

  getBooksByLanguage: (lang: string) =>
    apiClient<{ books: { id: number; name: string; testament: "Old" | "New"; chapters: number }[] }>(
      `/api/bible/books/by-language?language=${encodeURIComponent(lang)}`
    ),

  getBooks: (testament: Testament, lang: string) =>
    apiClient<GetBooksResponse>(
      `/api/bible/testaments/${testament}/books?language=${lang}`
    ),

  getChapters: (book: string, lang: string) =>
    apiClient<ChaptersResponse>(
      `/api/bible/books/${encodeURIComponent(book)}/chapters?language=${lang}`
    ),

  getChapter: async (
    book: string,
    chapter: number,
    lang: string
  ): Promise<ChapterContentResponse> => {
    const res = await apiClient<ChapterContentResponse>(
      `/api/bible/books/${encodeURIComponent(book)}/chapters/${chapter}?language=${lang}`
    );
    return { ...res, verses: removeDuplicateVerses(res.verses) };
  },

  getVerse: (book: string, chapter: number, verse: number, lang: string) =>
    apiClient<VerseResponse>(
      `/api/bible/books/${encodeURIComponent(book)}/chapters/${chapter}/verses/${verse}?language=${lang}`
    ),

  getFullBook: async (book: string, lang: string): Promise<FullBookResponse> => {
    const res = await apiClient<FullBookResponse>(
      `/api/bible/books/${encodeURIComponent(book)}?language=${lang}`
    );
    return {
      ...res,
      chapters: res.chapters.map((c) => ({
        ...c,
        verses: removeDuplicateVerses(c.verses),
      })),
    };
  },
};
