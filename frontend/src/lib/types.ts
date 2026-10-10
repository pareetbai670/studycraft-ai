// Shared types mirroring the backend's strict JSON contract.

export type AssetType =
  "worksheet" | "quiz" | "flashcards" | "mindmap" | "summary";

export type Difficulty = "beginner" | "intermediate" | "advanced" | "expert";

export type QuestionStyle =
  "analytical" | "theoretical" | "practical" | "mixed";

export type AcademicLevel =
  "high_school" | "undergraduate" | "postgraduate" | "general";

export interface GenerateConfig {
  asset_type: AssetType;
  difficulty: Difficulty;
  question_style: QuestionStyle;
  academic_level: AcademicLevel;
  count: number;
  force_mock: boolean;
}

export interface QuizQuestion {
  question: string;
  type: "multiple_choice" | "true_false" | "short_answer" | string;
  options: string[];
  answer: string;
  explanation: string;
}
export interface Quiz {
  title: string;
  type: "quiz";
  questions: QuizQuestion[];
}

export interface WorksheetExercise {
  prompt: string;
  type: "fill_blank" | "short_answer" | "practice_problem" | string;
  answer: string;
  hint: string;
}
export interface Worksheet {
  title: string;
  type: "worksheet";
  instructions: string;
  exercises: WorksheetExercise[];
}

export interface Flashcard {
  front: string;
  back: string;
  hint: string;
}
export interface FlashcardDeck {
  title: string;
  type: "flashcards";
  cards: Flashcard[];
}

export interface MindMapNode {
  title: string;
  children: MindMapNode[];
}
export interface MindMap {
  title: string;
  type: "mindmap";
  root: MindMapNode;
}

export interface SummarySection {
  heading: string;
  points: string[];
}
export interface Summary {
  title: string;
  type: "summary";
  executive_summary: string;
  key_takeaways: string[];
  sections: SummarySection[];
}

export type Asset = Quiz | Worksheet | FlashcardDeck | MindMap | Summary;

export interface GenerateMeta {
  provider: string;
  model: string;
  asset_type: AssetType;
  repaired: boolean;
  retries: number;
  mock: boolean;
}

export interface GenerateResponse {
  meta: GenerateMeta;
  asset: Asset;
}
