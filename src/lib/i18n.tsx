import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { bibleService } from "@/services/api";

export type AppLanguage = {
  id: number;
  code: string;
  name: string;
  native_name: string;
};

export type Lang = string;
type BuiltinLang = "en" | "am" | "om" | "ti";

export const LANGS: { code: Lang; label: string; native: string }[] = [
  { code: "en", label: "English", native: "English" },
  { code: "am", label: "Amharic", native: "አማርኛ" },
  { code: "om", label: "Afan Oromo", native: "Afaan Oromoo" },
  { code: "ti", label: "Tigrigna", native: "ትግርኛ" },
];

type Dict = {
  appName: string;
  tagline: string;
  chooseBook: string;
  booksCount: (n: number) => string;
  chaptersLabel: (n: number) => string;
  oldTestament: string;
  newTestament: string;
  oldCount: (n: number) => string;
  newCount: (n: number) => string;
  login: string;
  logout: string;
  myAccount: string;
  backToBooks: string;
  takeQuiz: string;
  chapter: string;
  language: string;
  searchPlaceholder: string;
  noResults: string;
};

const DICTS: Record<BuiltinLang, Dict> = {
  en: {
    appName: "Bible Quiz",
    tagline: "Grow in the Word, one verse at a time",
    chooseBook: "Choose a book to start the quiz",
    booksCount: (n) => `${n} books`,
    chaptersLabel: (n) => `${n} chapters`,
    oldTestament: "Old Testament",
    newTestament: "New Testament",
    oldCount: (n) => `${n} books`,
    newCount: (n) => `${n} books`,
    login: "Login",
    logout: "Logout",
    myAccount: "My Account",
    backToBooks: "Back to Books",
    takeQuiz: "Take Quiz",
    chapter: "Chapter",
    language: "Language",
    searchPlaceholder: "Search books by name…",
    noResults: "No books match your search.",
  },
  am: {
    appName: "የመጽሐፍ ቅዱስ ጥያቄ",
    tagline: "በቃሉ ውስጥ ያድጉ፣ በአንድ ጥቅስ በአንድ ጊዜ",
    chooseBook: "ጥያቄን ለመጀመር መጽሐፍ ይምረጡ",
    booksCount: (n) => `${n} መጻሕፍት`,
    chaptersLabel: (n) => `${n} ምዕራፎች`,
    oldTestament: "ብሉይ ኪዳን",
    newTestament: "አዲስ ኪዳን",
    oldCount: (n) => `${n} መጻሕፍት`,
    newCount: (n) => `${n} መጻሕፍት`,
    login: "ግባ",
    logout: "ውጣ",
    myAccount: "የእኔ መለያ",
    backToBooks: "ወደ መጻሕፍት ተመለስ",
    takeQuiz: "ጥያቄ ይውሰዱ",
    chapter: "ምዕራፍ",
    language: "ቋንቋ",
    searchPlaceholder: "መጻሕፍትን በስም ይፈልጉ…",
    noResults: "ከፍለጋዎ ጋር የሚዛመድ መጽሐፍ የለም።",
  },
  om: {
    appName: "Qormaata Macaafa Qulqulluu",
    tagline: "Dubbii keessatti guddadhu, aayata tokko yeroo tokkotti",
    chooseBook: "Qormaata jalqabuuf kitaaba filadhu",
    booksCount: (n) => `kitaabota ${n}`,
    chaptersLabel: (n) => `boqonnaa ${n}`,
    oldTestament: "Kakuu Moofaa",
    newTestament: "Kakuu Haaraa",
    oldCount: (n) => `kitaabota ${n}`,
    newCount: (n) => `kitaabota ${n}`,
    login: "Seeni",
    logout: "Ba'i",
    myAccount: "Herrega Koo",
    backToBooks: "Gara Kitaabotaatti deebi'i",
    takeQuiz: "Qormaata Fudhadhu",
    chapter: "Boqonnaa",
    language: "Afaan",
    searchPlaceholder: "Kitaabota maqaadhaan barbaadi…",
    noResults: "Kitaabni barbaachaa keessan waliin walsimu hin jiru.",
  },
  ti: {
    appName: "ናይ መጽሓፍ ቅዱስ ሕቶ",
    tagline: "ኣብ ቃል ኣምላኽ ዕበ፣ ሓደ ጥቕሲ ኣብ ሓደ ግዜ",
    chooseBook: "ሕቶ ንምጅማር መጽሓፍ ምረጽ",
    booksCount: (n) => `${n} መጻሕፍቲ`,
    chaptersLabel: (n) => `${n} ምዕራፋት`,
    oldTestament: "ብሉይ ኪዳን",
    newTestament: "ሓድሽ ኪዳን",
    oldCount: (n) => `${n} መጻሕፍቲ`,
    newCount: (n) => `${n} መጻሕፍቲ`,
    login: "እቶ",
    logout: "ውጻእ",
    myAccount: "ሕሳበይ",
    backToBooks: "ናብ መጻሕፍቲ ተመለስ",
    takeQuiz: "ሕቶ ውሰድ",
    chapter: "ምዕራፍ",
    language: "ቋንቋ",
    searchPlaceholder: "መጻሕፍቲ ብስም ድለ…",
    noResults: "ምስ ድሌትካ ዝሰማማዕ መጽሓፍ የለን።",
  },
};

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  languages: AppLanguage[];
  languageId: number | null;
  languagesLoading: boolean;
  languagesError: string | null;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bible.lang");
      if (saved) setLangState(saved);
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("bible.lang", l);
    } catch {}
  };

  const langsQuery = useQuery({
    queryKey: ["bible-languages"],
    queryFn: () => bibleService.getLanguages(),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const languages: AppLanguage[] = langsQuery.data?.data ?? [];
  const selected = languages.find((l) => l.code === lang);
  const languageId = selected?.id ?? null;

  const dict = (DICTS as Record<string, Dict>)[lang] ?? DICTS.en;
  return (
    <Ctx.Provider
      value={{
        lang,
        setLang,
        t: dict,
        languages,
        languageId,
        languagesLoading: langsQuery.isLoading,
        languagesError: langsQuery.error ? (langsQuery.error as Error).message : null,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}