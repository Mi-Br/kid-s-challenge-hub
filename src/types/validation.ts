export type ValidationMode = "literal" | "keywords";

export interface KeywordValidationConfig {
  mode: "keywords";
  minWords: number; // Minimum words required (default: 3)
  mustIncludeAny: string[][]; // 2D array: [[synonyms], [synonyms]]
  // Must match at least one word from each inner array
  allowExtraText: boolean; // Accept additional words (should be true)
  disallowedKeywords?: string[]; // Optional: reject if these appear
}

export interface LiteralValidationConfig {
  mode: "literal";
  acceptableAnswers: string[]; // Case-insensitive exact matches
}

export type ValidationConfig = LiteralValidationConfig | KeywordValidationConfig;

export interface ValidationResult {
  isCorrect: boolean;
  feedback?: {
    mode: ValidationMode;
    matchedKeywords?: string[]; // Keywords that matched
    missingKeywordGroups?: string[][]; // Keyword groups that didn't match
    wordCount?: number; // Number of words in answer
    acceptableAnswers?: string[]; // For literal mode
  };
}
