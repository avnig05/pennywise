import { apiFetch } from "./client";

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  question_order: number;
}

export interface Quiz {
  quiz_id: string;
  article_id: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  score: number;
  total_questions: number;
  correct_answers: number;
  completed: boolean;
}

export interface ArticleCompletion {
  id: string;
  user_id: string;
  article_id: string;
  quiz_score: number;
  completed_at: string;
  user_answers?: number[]; // User's selected answers (0-3 for each question)
}

//Return article quiz
export async function getArticleQuiz(articleId: string): Promise<Quiz> {
  return apiFetch<Quiz>(`/quizzes/article/${articleId}`, { method: "GET" });
}

//Submit quiz answers
export async function submitQuizAnswers(
  articleId: string,
  answers: number[]
): Promise<QuizResult> {
  return apiFetch<QuizResult>(`/quizzes/article/${articleId}/submit`, {
    method: "POST",
    body: JSON.stringify({ answers }),
  });
}
//Check if user already completed the article quiz
export async function getArticleCompletion(
  articleId: string
): Promise<ArticleCompletion | null> {
  try {
    const data = await apiFetch<ArticleCompletion | null>(
      `/quizzes/article/${articleId}/completion`,
      { method: "GET" }
    );
    return data;
  } catch {
    return null;
  }
}

/** Regenerate a new quiz for the same article (different questions). Returns the new quiz. */
export async function regenerateArticleQuiz(articleId: string): Promise<Quiz> {
  return apiFetch<Quiz>(`/quizzes/article/${articleId}/regenerate`, {
    method: "POST",
  });
}
