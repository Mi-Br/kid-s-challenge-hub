export type ValidationMode = "literal" | "keywords" | "ai";

// ── Literal: exact string matching ──
export interface LiteralValidationConfig {
  mode: "literal";
  acceptableAnswers: string[]; // Case-insensitive exact matches
}

// ── Keywords: flexible matching for simple explanations ──
export interface KeywordValidationConfig {
  mode: "keywords";
  minWords: number;
  mustIncludeAny: string[][]; // 2D array: [[synonyms], [synonyms]]
  allowExtraText: boolean;
  disallowedKeywords?: string[];
}

// ── AI: LLM-evaluated open-ended answers ──
// Used for complex comprehension: hoofdgedachte, evalueren, samenvatten, schrijversdoel
export interface AiValidationConfig {
  mode: "ai";
  /** Short rubric: what makes an answer correct. Written in Dutch for the evaluator. */
  rubric: string;
  /** Example of a good answer (for the evaluator, not shown to student). */
  exampleAnswer: string;
  /** Key concepts that should be present. Also serves as keyword fallback if API unavailable. */
  keyElements: string[];
  /** Minimum words required before sending to AI (saves API calls on empty/tiny answers). */
  minWords: number;
}

export type ValidationConfig =
  | LiteralValidationConfig
  | KeywordValidationConfig
  | AiValidationConfig;

// ── Results ──

export type AiJudgement = "correct" | "partial" | "incorrect";

export interface ValidationResult {
  isCorrect: boolean;
  /** For AI mode: partial credit */
  judgement?: AiJudgement;
  /** Points awarded: correct=25, partial=15, incorrect=0 */
  points?: number;
  feedback?: {
    mode: ValidationMode;
    /** AI-generated feedback in Dutch, encouraging and age-appropriate */
    aiFeedback?: string;
    /** Whether AI evaluation was used (false = fell back to keywords) */
    aiEvaluated?: boolean;
    matchedKeywords?: string[];
    missingKeywordGroups?: string[][];
    wordCount?: number;
    acceptableAnswers?: string[];
  };
}
