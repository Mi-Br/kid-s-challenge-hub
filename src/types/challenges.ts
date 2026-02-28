import type { ValidationConfig } from "./validation";

export type GroepLevel = "groep4-5" | "groep5-6" | "groep7-8";
export type Difficulty = "low" | "medium" | "high";
export type QuestionType =
  | "begrijpen"
  | "interpreteren"
  | "evalueren"
  | "hoofdgedachte"
  | "samenvatten"
  | "schrijversdoel"
  | "woordbetekenis";

export interface DutchQuestion {
  question: string;
  questionType?: QuestionType;
  acceptableAnswers?: string[];
  hint?: string;
  answerType?: "literal" | "explanation";
  validation?: ValidationConfig;
}

export interface DutchChallenge {
  id: string;
  title: string;
  text: string;
  groepLevel?: GroepLevel;
  difficulty?: Difficulty;
  referentieNiveau?: "toward-1F" | "1F" | "toward-1S/2F";
  topic?: string;
  images: { src: string; alt: string }[];
  questions: DutchQuestion[];
  imagePrompts?: string[];
  level?: number; // deprecated — backward compat
}
