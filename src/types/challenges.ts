import type { ValidationConfig } from "./validation";

export interface DutchQuestion {
  question: string;
  // LEGACY: Keep for backward compatibility
  // If present and no validation field, uses this for literal validation
  acceptableAnswers?: string[]; // lowercase variants that are accepted
  hint?: string;

  // NEW: Optional answer type (defaults to 'literal' if not specified)
  answerType?: "literal" | "explanation";

  // NEW: Modern validation config (optional)
  validation?: ValidationConfig;
}

export interface DutchChallenge {
  id: string;
  title: string;
  text: string;
  images: { src: string; alt: string }[];
  questions: DutchQuestion[];
  level?: number; // 1, 2, or 3 for beginner, intermediate, advanced
}
