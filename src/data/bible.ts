export type Book = { name: string; testament: "Old" | "New"; chapters: number };

export const BOOKS: Book[] = [
  { name: "Genesis", testament: "Old", chapters: 50 },
  { name: "Exodus", testament: "Old", chapters: 40 },
  { name: "Leviticus", testament: "Old", chapters: 27 },
  { name: "Numbers", testament: "Old", chapters: 36 },
  { name: "Deuteronomy", testament: "Old", chapters: 34 },
  { name: "Joshua", testament: "Old", chapters: 24 },
  { name: "Judges", testament: "Old", chapters: 21 },
  { name: "Ruth", testament: "Old", chapters: 4 },
  { name: "1 Samuel", testament: "Old", chapters: 31 },
  { name: "2 Samuel", testament: "Old", chapters: 24 },
  { name: "1 Kings", testament: "Old", chapters: 22 },
  { name: "2 Kings", testament: "Old", chapters: 25 },
  { name: "Psalms", testament: "Old", chapters: 150 },
  { name: "Proverbs", testament: "Old", chapters: 31 },
  { name: "Isaiah", testament: "Old", chapters: 66 },
  { name: "Jeremiah", testament: "Old", chapters: 52 },
  { name: "Daniel", testament: "Old", chapters: 12 },
  { name: "Matthew", testament: "New", chapters: 28 },
  { name: "Mark", testament: "New", chapters: 16 },
  { name: "Luke", testament: "New", chapters: 24 },
  { name: "John", testament: "New", chapters: 21 },
  { name: "Acts", testament: "New", chapters: 28 },
  { name: "Romans", testament: "New", chapters: 16 },
  { name: "1 Corinthians", testament: "New", chapters: 16 },
  { name: "2 Corinthians", testament: "New", chapters: 13 },
  { name: "Galatians", testament: "New", chapters: 6 },
  { name: "Ephesians", testament: "New", chapters: 6 },
  { name: "Philippians", testament: "New", chapters: 4 },
  { name: "Hebrews", testament: "New", chapters: 13 },
  { name: "James", testament: "New", chapters: 5 },
  { name: "1 Peter", testament: "New", chapters: 5 },
  { name: "Revelation", testament: "New", chapters: 22 },
];

export function findBook(slug: string): Book | undefined {
  const norm = slug.toLowerCase().replace(/-/g, " ");
  return BOOKS.find((b) => b.name.toLowerCase() === norm);
}

export function bookSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

// Localized book names. Keyed by English name.
export const BOOK_NAMES: Record<string, { en: string; am: string; om: string; ti: string }> = {
  Genesis: { en: "Genesis", am: "ዘፍጥረት", om: "Uumama", ti: "ዘፍጥረት" },
  Exodus: { en: "Exodus", am: "ዘፀአት", om: "Ba'uu", ti: "ዘጸኣት" },
  Leviticus: { en: "Leviticus", am: "ዘሌዋውያን", om: "Lewwoota", ti: "ዘሌዋውያን" },
  Numbers: { en: "Numbers", am: "ዘኍልቍ", om: "Lakkoofsa", ti: "ዘሁልቁ" },
  Deuteronomy: { en: "Deuteronomy", am: "ዘዳግም", om: "Keessa Deebii", ti: "ዘዳግም" },
  Joshua: { en: "Joshua", am: "ኢያሱ", om: "Iyaasuu", ti: "እያሱ" },
  Judges: { en: "Judges", am: "መሣፍንት", om: "Abboota Firdii", ti: "መሳፍንቲ" },
  Ruth: { en: "Ruth", am: "ሩት", om: "Ruut", ti: "ሩት" },
  "1 Samuel": { en: "1 Samuel", am: "1ኛ ሳሙኤል", om: "Saamuʼeel 1ffaa", ti: "1ይ ሳሙኤል" },
  "2 Samuel": { en: "2 Samuel", am: "2ኛ ሳሙኤል", om: "Saamuʼeel 2ffaa", ti: "2ይ ሳሙኤል" },
  "1 Kings": { en: "1 Kings", am: "1ኛ ነገሥት", om: "Mootota 1ffaa", ti: "1ይ ነገስት" },
  "2 Kings": { en: "2 Kings", am: "2ኛ ነገሥት", om: "Mootota 2ffaa", ti: "2ይ ነገስት" },
  Psalms: { en: "Psalms", am: "መዝሙር", om: "Faarfannaa", ti: "መዝሙር" },
  Proverbs: { en: "Proverbs", am: "ምሳሌ", om: "Fakkeenya", ti: "ምሳሌ" },
  Isaiah: { en: "Isaiah", am: "ኢሳይያስ", om: "Isaayaas", ti: "ኢሳይያስ" },
  Jeremiah: { en: "Jeremiah", am: "ኤርምያስ", om: "Ermiyaas", ti: "ኤርምያስ" },
  Daniel: { en: "Daniel", am: "ዳንኤል", om: "Daaniʼel", ti: "ዳንኤል" },
  Matthew: { en: "Matthew", am: "ማቴዎስ", om: "Maatewos", ti: "ማቴዎስ" },
  Mark: { en: "Mark", am: "ማርቆስ", om: "Maarqos", ti: "ማርቆስ" },
  Luke: { en: "Luke", am: "ሉቃስ", om: "Luqaas", ti: "ሉቃስ" },
  John: { en: "John", am: "ዮሐንስ", om: "Yohaannis", ti: "ዮሃንስ" },
  Acts: { en: "Acts", am: "ሐዋርያት", om: "Hojii Ergamootaa", ti: "ግብሪ ሃዋርያት" },
  Romans: { en: "Romans", am: "ሮሜ", om: "Roomaa", ti: "ሮሜ" },
  "1 Corinthians": { en: "1 Corinthians", am: "1ኛ ቆሮንቶስ", om: "Qorontos 1ffaa", ti: "1ይ ቆረንቶስ" },
  "2 Corinthians": { en: "2 Corinthians", am: "2ኛ ቆሮንቶስ", om: "Qorontos 2ffaa", ti: "2ይ ቆረንቶስ" },
  Galatians: { en: "Galatians", am: "ገላትያ", om: "Galaatiyaa", ti: "ገላትያ" },
  Ephesians: { en: "Ephesians", am: "ኤፌሶን", om: "Efesoon", ti: "ኤፌሶን" },
  Philippians: { en: "Philippians", am: "ፊልጵስዩስ", om: "Filiphisiyus", ti: "ፊልጵስዩስ" },
  Hebrews: { en: "Hebrews", am: "ዕብራውያን", om: "Ibroota", ti: "እብራውያን" },
  James: { en: "James", am: "ያዕቆብ", om: "Yaaqoob", ti: "ያእቆብ" },
  "1 Peter": { en: "1 Peter", am: "1ኛ ጴጥሮስ", om: "Pheexros 1ffaa", ti: "1ይ ጴጥሮስ" },
  Revelation: { en: "Revelation", am: "ራእይ", om: "Mul'ata", ti: "ራእይ" },
};

export function localizedBookName(name: string, lang: string): string {
  const k = (["en", "am", "om", "ti"] as const).includes(lang as any) ? (lang as "en"|"am"|"om"|"ti") : "en";
  return BOOK_NAMES[name]?.[k] ?? name;
}

// Placeholder verses — swap in real text later.
export function getChapterVerses(book: string, chapter: number): { n: number; text: string }[] {
  const count = 18 + ((chapter * 7) % 14);
  return Array.from({ length: count }, (_, i) => ({
    n: i + 1,
    text: `Placeholder verse ${i + 1} of ${book} chapter ${chapter}. Replace this text with the real scripture passage when your Bible content source is connected.`,
  }));
}