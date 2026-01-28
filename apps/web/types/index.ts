export type ArticleCategory =
  | "Student Loans"
  | "Credit Cards"
  | "Budgeting"
  | "Building Credit"
  | "Investing"
  | "Taxes";

export type Difficulty = "Beginner" | "Intermediate" | "Advanced";

export interface Article {
  id: string;
  title: string;
  description: string;
  category: ArticleCategory;
  readTimeMin: number;
  difficulty: Difficulty;
}

export interface ProgressItem {
  topic: ArticleCategory;
  percent: number;
}

export interface Tip {
  text: string;
}
