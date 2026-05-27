export type Question = {
  q: string;
  choices: string[];
  answer: number; // index
};

const generic: Record<1 | 2 | 3, Question[]> = {
  1: [
    { q: "Who created the heavens and the earth?", choices: ["Moses", "God", "Abraham", "David"], answer: 1 },
    { q: "How many days did God take to create the world?", choices: ["3", "5", "6", "7"], answer: 2 },
    { q: "What did God do on the seventh day?", choices: ["Created man", "Rested", "Made stars", "Sent rain"], answer: 1 },
    { q: "Who was the first man?", choices: ["Noah", "Adam", "Cain", "Seth"], answer: 1 },
    { q: "Who was the first woman?", choices: ["Sarah", "Mary", "Eve", "Ruth"], answer: 2 },
  ],
  2: [
    { q: "Which fruit was forbidden in Eden?", choices: ["Apple", "Fig", "Tree of Knowledge of Good and Evil", "Pomegranate"], answer: 2 },
    { q: "Who built the ark?", choices: ["Abraham", "Noah", "Moses", "Lot"], answer: 1 },
    { q: "How many of each animal entered the ark?", choices: ["One", "A pair", "Seven", "Ten"], answer: 1 },
    { q: "Who was tested by being asked to sacrifice his son?", choices: ["Isaac", "Jacob", "Abraham", "Joseph"], answer: 2 },
    { q: "Who interpreted Pharaoh's dreams?", choices: ["Daniel", "Joseph", "Moses", "Aaron"], answer: 1 },
  ],
  3: [
    { q: "What covenant sign did God give Noah?", choices: ["A dove", "A rainbow", "A star", "A cloud"], answer: 1 },
    { q: "What was the name of Abraham's wife?", choices: ["Rebekah", "Leah", "Sarah", "Rachel"], answer: 2 },
    { q: "Who wrestled with God and was renamed Israel?", choices: ["Esau", "Jacob", "Joseph", "Isaac"], answer: 1 },
    { q: "How many sons did Jacob have?", choices: ["10", "11", "12", "13"], answer: 2 },
    { q: "Where was Joseph sold into slavery?", choices: ["Babylon", "Egypt", "Persia", "Canaan"], answer: 1 },
  ],
};

export function getQuiz(book: string, level: 1 | 2 | 3): Question[] {
  const base = generic[level];
  return base.map((q) => ({ ...q, q: `(${book}) ${q.q}` }));
}