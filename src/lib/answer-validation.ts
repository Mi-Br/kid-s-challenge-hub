import type { DutchQuestion } from "@/types/challenges";
import type {
  ValidationConfig,
  ValidationResult,
  KeywordValidationConfig,
  LiteralValidationConfig,
} from "@/types/validation";

/**
 * Normalize text for comparison:
 * - Lowercase
 * - Trim whitespace
 * - Remove punctuation
 * - Remove extra spaces
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;]/g, "") // Remove punctuation
    .replace(/\s+/g, " "); // Remove extra spaces
}

/**
 * Validate answer using literal mode (exact string matching)
 */
export function validateLiteral(
  answer: string,
  config: LiteralValidationConfig
): ValidationResult {
  const normalized = normalizeText(answer);
  const normalizedAnswers = config.acceptableAnswers.map(normalizeText);

  const isCorrect = normalizedAnswers.some((a) => a === normalized);

  return {
    isCorrect,
    feedback: {
      mode: "literal",
      acceptableAnswers: config.acceptableAnswers,
    },
  };
}

/**
 * Validate answer using keywords mode (flexible matching for explanations)
 */
export function validateKeywords(
  answer: string,
  config: KeywordValidationConfig
): ValidationResult {
  const normalized = normalizeText(answer);
  const words = normalized.split(" ").filter((w) => w.length > 0);

  // Check minimum word count
  if (words.length < config.minWords) {
    return {
      isCorrect: false,
      feedback: {
        mode: "keywords",
        wordCount: words.length,
        missingKeywordGroups: config.mustIncludeAny,
      },
    };
  }

  // Check for disallowed keywords
  if (config.disallowedKeywords) {
    for (const disallowed of config.disallowedKeywords) {
      if (normalized.includes(normalizeText(disallowed))) {
        return {
          isCorrect: false,
          feedback: {
            mode: "keywords",
            wordCount: words.length,
            missingKeywordGroups: config.mustIncludeAny,
          },
        };
      }
    }
  }

  // Check if at least one keyword from each group matches
  const matchedKeywords: string[] = [];
  const missingGroups: string[][] = [];

  for (const keywordGroup of config.mustIncludeAny) {
    const groupMatch = keywordGroup.find((keyword) =>
      normalized.includes(normalizeText(keyword))
    );

    if (groupMatch) {
      matchedKeywords.push(groupMatch);
    } else {
      missingGroups.push(keywordGroup);
    }
  }

  // All keyword groups must have at least one match
  const isCorrect = missingGroups.length === 0;

  return {
    isCorrect,
    feedback: {
      mode: "keywords",
      matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : undefined,
      missingKeywordGroups: missingGroups.length > 0 ? missingGroups : undefined,
      wordCount: words.length,
    },
  };
}

/**
 * Main validation function - routes to appropriate validator based on question config
 */
export function validateAnswer(
  answer: string,
  question: DutchQuestion
): ValidationResult {
  // Handle validation with explicit validation config
  if (question.validation) {
    if (question.validation.mode === "literal") {
      return validateLiteral(answer, question.validation);
    } else if (question.validation.mode === "keywords") {
      return validateKeywords(answer, question.validation);
    }
  }

  // Handle legacy format: acceptableAnswers field (backward compatibility)
  if (question.acceptableAnswers) {
    return validateLiteral(answer, {
      mode: "literal",
      acceptableAnswers: question.acceptableAnswers,
    });
  }

  // No validation config found
  return {
    isCorrect: false,
    feedback: {
      mode: "literal",
      acceptableAnswers: [],
    },
  };
}
