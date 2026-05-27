import { apiClient } from "./api";

/**
 * Admin service.
 *
 * NOTE: The backend admin endpoints below follow a conventional pattern
 * (/api/admin/...). If your backend exposes different paths, update these
 * URLs in one place — the UI will work as soon as the endpoints respond.
 */

export type AdminUser = {
  id: number;
  username: string;
  email: string;
  created_at: string;
  total_quizzes_taken: number;
  is_active: boolean;
  role?: "admin" | "user";
};

export type AdminLanguage = {
  language_id: number;
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
  questions_count?: number;
};

export type AdminBook = {
  book_id: number;
  name: string;
  testament: "Old" | "New";
  chapters_count: number;
  verses_count: number;
  questions_count: number;
  difficulty_breakdown?: { easy: number; medium: number; hard: number };
};

export type AdminActivity = {
  id: number;
  type: "user_registered" | "quiz_completed" | "questions_added" | string;
  message: string;
  created_at: string;
};

export type AdminStats = {
  total_users: number;
  total_languages: number;
  total_books: number;
  total_questions: number;
};

export const adminService = {
  // Dashboard
  getStats: () => apiClient<{ success: boolean; stats: AdminStats }>("/api/admin/stats"),
  getActivity: (limit = 10) =>
    apiClient<{ success: boolean; activities: AdminActivity[] }>(
      `/api/admin/activity?limit=${limit}`
    ),

  // Users
  listUsers: (params: { search?: string; status?: "active" | "inactive" | "all"; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.status && params.status !== "all") q.set("status", params.status);
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 20));
    return apiClient<{ success: boolean; users: AdminUser[]; total: number; page: number; limit: number }>(
      `/api/admin/users?${q.toString()}`
    );
  },
  getUser: (id: number) =>
    apiClient<{ success: boolean; user: AdminUser; quiz_history: any[] }>(`/api/admin/users/${id}`),
  createUser: (data: { username: string; email: string; password: string }) =>
    apiClient<{ success: boolean; user: AdminUser }>("/api/admin/users", "POST", data),
  updateUser: (id: number, data: Partial<{ username: string; email: string; is_active: boolean }>) =>
    apiClient<{ success: boolean; user: AdminUser }>(`/api/admin/users/${id}`, "PUT", data),
  setUserActive: (id: number, is_active: boolean) =>
    apiClient<{ success: boolean }>(`/api/admin/users/${id}/status`, "PUT", { is_active }),

  // Languages
  listLanguages: () =>
    apiClient<{ success: boolean; languages: AdminLanguage[] }>("/api/admin/languages"),
  createLanguage: (data: { code: string; name: string; native_name: string; is_active?: boolean }) =>
    apiClient<{ success: boolean; language: AdminLanguage }>("/api/admin/languages", "POST", data),
  updateLanguage: (id: number, data: Partial<AdminLanguage>) =>
    apiClient<{ success: boolean; language: AdminLanguage }>(`/api/admin/languages/${id}`, "PUT", data),
  deleteLanguage: (id: number) =>
    apiClient<{ success: boolean }>(`/api/admin/languages/${id}`, "DELETE"),

  // Books
  listBooks: (params: { search?: string; testament?: "Old" | "New" | "all"; page?: number; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.search) q.set("search", params.search);
    if (params.testament && params.testament !== "all") q.set("testament", params.testament);
    q.set("page", String(params.page ?? 1));
    q.set("limit", String(params.limit ?? 20));
    return apiClient<{ success: boolean; books: AdminBook[]; total: number }>(
      `/api/admin/books?${q.toString()}`
    );
  },
  createBook: (data: Partial<AdminBook>) =>
    apiClient<{ success: boolean; book: AdminBook }>("/api/admin/books", "POST", data),
  updateBook: (id: number, data: Partial<AdminBook>) =>
    apiClient<{ success: boolean; book: AdminBook }>(`/api/admin/books/${id}`, "PUT", data),
  deleteBook: (id: number) =>
    apiClient<{ success: boolean }>(`/api/admin/books/${id}`, "DELETE"),

  // Imports
  importBible: (data: { language_code: string; file_path: string; batch?: boolean }) =>
    apiClient<{ success: boolean; job_id?: string; message: string }>(
      "/api/admin/import/bible",
      "POST",
      data
    ),
  importQuestions: (data: { language_code: string; book_name: string; file_path: string; batch?: boolean }) =>
    apiClient<{
      success: boolean;
      job_id?: string;
      message: string;
      preview?: { total: number; difficulty: { easy: number; medium: number; hard: number }; sample?: any };
    }>("/api/admin/import/questions", "POST", data),
  validateQuestionsJson: (data: { json: string }) =>
    apiClient<{
      success: boolean;
      valid: boolean;
      errors?: string[];
      preview?: { total: number; difficulty: { easy: number; medium: number; hard: number }; sample?: any };
    }>("/api/admin/import/questions/validate", "POST", data),
};
