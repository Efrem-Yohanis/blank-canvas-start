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

  if (!response.ok || (data as any)?.status === "error") {
    const raw = data as any;
    let message = raw?.message || raw?.error;
    // Django validation errors: { errors: { field: ["msg"] } }
    if (!message && raw?.errors) {
      const firstField = Object.values(raw.errors)[0] as any;
      message = Array.isArray(firstField) ? firstField[0] : String(firstField);
    }
    throw new ApiError(message || `HTTP ${response.status}`, response.status, data);
  }
  return data as T;
}

// ───────────────────────── Auth ─────────────────────────
export type DjangoLoginRes = {
  status: "success";
  data: {
    access_token: string;
    token_type: string;
    expires_at: string;
    user_id: number;
    username: string;
    is_admin: boolean;
  };
};

export type DjangoRegisterRes = {
  status: "success";
  message: string;
  data: {
    id: number;
    username: string;
    email: string;
  };
};

export const authService = {
  register: (email: string, password: string, username: string) =>
    apiClient<DjangoRegisterRes>("/api/auth/register", "POST", {
      email,
      password,
      username,
    }),
  login: (email: string, password: string) =>
    apiClient<DjangoLoginRes>("/api/auth/login", "POST", {
      username_or_email: email,
      password,
    }),
  logout: () =>
    apiClient<{ status: string; message: string }>("/api/auth/logout", "POST"),
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

/** Options come from the API as {A,B,C,D}; we normalize to array form */
export type QuizQuestionOption = { label: string; text: string };

export type QuizQuestion = {
  question_id: number;
  text: string;
  verse_reference: string;
  options: QuizQuestionOption[];
};

export type AnswerResult = {
  is_correct: boolean;
  correct_option: { label: string; text: string };
  verse_reference?: string;
  verse_text?: string;
  explanation?: string;
  progress: { answered: number; total: number; remaining: number };
};

export type QuizLevel = {
  level_id: number;
  level_number: number;
  name: string;
  description: string;
  color: string;
  icon: string;
  total_questions?: number;
};

export type QuizStartResult = {
  attempt_id: number;
  book: { id: number; name: string };
  level: { id: number; name: string };
  total_questions: number;
  first_question: QuizQuestion;
  started_at?: string;
};

export type QuizNextResult =
  | {
      attempt_id: number;
      question_number: number;
      total_questions: number;
      remaining_questions: number;
      question: QuizQuestion;
    }
  | { completed: true; message: string; review_url?: string };

export type QuizFinishResult = {
  attempt_id: number;
  results: {
    total_questions: number;
    correct_answers: number;
    incorrect_answers: number;
    score_percentage: number;
    time_taken?: string;
  };
};

export type QuizReviewResult = {
  attempt_id: number;
  summary: {
    total: number;
    correct: number;
    incorrect: number;
    score: number;
  };
  answers: {
    question_number: number;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    correct_answer_text?: string;
    is_correct: boolean;
    explanation?: string;
    verse_reference?: string;
  }[];
};

// Normalize options shape: API may return either {A:"...",B:"..."} or [{label,text}]
function normalizeOptions(opts: unknown): QuizQuestionOption[] {
  if (!opts) return [];
  if (Array.isArray(opts)) return opts as QuizQuestionOption[];
  if (typeof opts === "object") {
    return Object.entries(opts as Record<string, string>).map(([label, text]) => ({
      label,
      text,
    }));
  }
  return [];
}

function normalizeQuestion(q: any): QuizQuestion {
  return {
    question_id: q.question_id ?? q.id,
    text: q.text,
    verse_reference: q.verse_reference ?? "",
    options: normalizeOptions(q.options),
  };
}

export const quizService = {
  getLanguages: () =>
    apiClient<{ success: boolean; data: QuizLanguage[] }>("/api/quiz/languages"),

  getBooks: () =>
    apiClient<{ success: boolean; data: QuizBook[] }>("/api/quiz/books"),

  getLevels: async (book_id: number) => {
    const res = await apiClient<{
      success: boolean;
      data: { book_id: number; book_name: string; levels: any[] };
    }>(`/api/quiz/books/${book_id}/levels`);
    // Normalize: spec uses {id, name, total_questions}; existing UI uses level_id/level_number/...
    const levels: QuizLevel[] = (res.data?.levels ?? []).map((l: any, i: number) => ({
      level_id: l.level_id ?? l.id,
      level_number: l.level_number ?? l.id ?? i + 1,
      name: l.name,
      description: l.description ?? `${l.total_questions ?? l.question_count ?? ""} questions`,
      color: l.color ?? ["#10b981", "#f59e0b", "#ef4444"][i % 3],
      icon: l.icon ?? ["🌱", "⚡", "🔥"][i % 3],
      total_questions: l.total_questions ?? l.question_count,
    }));
    return { success: res.success, data: { ...res.data, levels } };
  },

  start: async (book_id: number, level_id: number, language_id: number) => {
    const res = await apiClient<{ success: boolean; data: any }>(
      "/api/quiz/start",
      "POST",
      { book_id, level_id, language_id }
    );
    const d = res.data ?? {};
    const result: QuizStartResult = {
      attempt_id: d.attempt_id,
      book: d.book ?? { id: book_id, name: "" },
      level: d.level ?? { id: level_id, name: "" },
      total_questions: d.total_questions,
      first_question: d.first_question ? normalizeQuestion(d.first_question) : (undefined as any),
      started_at: d.started_at,
    };
    return { success: res.success, data: result };
  },

  next: async (attempt_id: number) => {
    const res = await apiClient<{ success: boolean; data: any }>(
      `/api/quiz/${attempt_id}/next`
    );
    const d = res.data ?? {};
    let data: QuizNextResult;
    if (d.completed) {
      data = { completed: true, message: d.message ?? "", review_url: d.review_url };
    } else {
      const total = d.total_questions ?? (d.progress?.answered ?? 0) + (d.progress?.remaining ?? 0);
      data = {
        attempt_id: d.attempt_id ?? attempt_id,
        question_number: d.question_number,
        total_questions: total,
        remaining_questions: d.progress?.remaining ?? Math.max(0, total - d.question_number),
        question: normalizeQuestion(d.question),
      };
    }
    return { success: res.success, data };
  },

  answer: async (
    attempt_id: number,
    question_id: number,
    selected_option: string
  ) => {
    const res = await apiClient<{ success: boolean; data: any }>(
      "/api/quiz/answer",
      "POST",
      { attempt_id, question_id, selected_option }
    );
    const d = res.data ?? {};
    // correct_option may be a string letter; wrap to {label,text}
    const correct =
      typeof d.correct_option === "string"
        ? { label: d.correct_option, text: "" }
        : d.correct_option ?? { label: "", text: "" };
    const data: AnswerResult = {
      is_correct: !!d.is_correct,
      correct_option: correct,
      verse_reference: d.verse_reference,
      verse_text: d.verse_text,
      explanation: d.explanation,
      progress: d.progress ?? { answered: 0, total: 0, remaining: 0 },
    };
    return { success: res.success, data };
  },

  finish: (attempt_id: number) =>
    apiClient<{ success: boolean; data: QuizFinishResult }>(
      `/api/quiz/${attempt_id}/finish`,
      "POST"
    ),

  review: (attempt_id: number) =>
    apiClient<{ success: boolean; data: QuizReviewResult }>(
      `/api/quiz/${attempt_id}/review`
    ),
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
export type FullBookChapter = {
  chapter: number;
  verses: BibleVerse[];
  has_audio?: boolean;
  audio_url?: string | null;
  audio_duration?: number | null;
};
export type FullBookResponse = {
  book: string;
  book_id?: number;
  language?: string;
  has_audio?: boolean;
  audio_info?: {
    has_audio: boolean;
    type?: string;
    book_audio_url?: string | null;
    book_duration?: number | null;
    chapters_with_audio?: number;
  };
  chapters: FullBookChapter[];
};

export type AudioProgress = {
  completed_chapters: number[];
  current_chapter: number;
  next_chapter?: number;
  book_completed: boolean;
  progress_percentage: number;
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
    apiClient<{
      books: {
        id: number;
        name: string;
        testament: "Old" | "New";
        chapters: number;
        has_audio?: boolean;
        bible_order?: number;
      }[];
    }>(`/api/bible/books/by-language?language=${encodeURIComponent(lang)}`),

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

// ───────────────────────── Audio Progress ─────────────────────────
export const audioService = {
  getProgress: (book_id: number) =>
    apiClient<{ status: string; data: AudioProgress }>(
      `/api/user/audio/progress/${book_id}`
    ),
  recordCompletion: (book_id: number, chapter: number, lang: string) =>
    apiClient<{ status: string; data: AudioProgress }>(
      `/api/audio/record/${book_id}/${chapter}?language=${encodeURIComponent(lang)}`,
      "POST"
    ),
};
