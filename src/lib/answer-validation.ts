import type { DutchQuestion } from "@/types/challenges";
import type {
  ValidationConfig,
  ValidationResult,
  KeywordValidationConfig,
  LiteralValidationConfig,
  AiValidationConfig,
} from "@/types/validation";
import { evaluateWithAi, isAiAvailable } from "./ai-evaluation";

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
    points: isCorrect ? 25 : 0,
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
      points: 0,
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
          points: 0,
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
    points: isCorrect ? 25 : 0,
    feedback: {
      mode: "keywords",
      matchedKeywords: matchedKeywords.length > 0 ? matchedKeywords : undefined,
      missingKeywordGroups: missingGroups.length > 0 ? missingGroups : undefined,
      wordCount: words.length,
    },
  };
}

/**
 * Determine the validation mode for a question.
 * Useful for UI to show loading state for AI questions.
 */
export function getValidationMode(question: DutchQuestion): "literal" | "keywords" | "ai" {
  if (question.validation?.mode) return question.validation.mode;
  if (question.acceptableAnswers) return "literal";
  return "literal";
}

/**
 * Check if a question requires async (AI) validation.
 */
export function requiresAiValidation(question: DutchQuestion): boolean {
  return question.validation?.mode === "ai" && isAiAvailable();
}

/**
 * Synchronous validation — for literal and keywords modes.
 * For AI mode, use validateAnswerAsync instead.
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
    } else if (question.validation.mode === "ai") {
      // Synchronous fallback for AI mode — use keyword matching on keyElements
      const aiConfig = question.validation as AiValidationConfig;
      const normalized = normalizeText(answer);
      const words = normalized.split(" ").filter(w => w.length > 0);

      if (words.length < aiConfig.minWords) {
        return {
          isCorrect: false,
          points: 0,
          feedback: { mode: "ai", aiEvaluated: false, wordCount: words.length },
        };
      }

      // Simple fallback: check keyElements as keywords
      let matched = 0;
      for (const element of aiConfig.keyElements) {
        const variants = element.split("/").map(v => v.trim().toLowerCase());
        if (variants.some(v => normalized.includes(v))) matched++;
      }
      const ratio = aiConfig.keyElements.length > 0 ? matched / aiConfig.keyElements.length : 0;
      const isCorrect = ratio >= 0.7;

      return {
        isCorrect,
        points: isCorrect ? 25 : ratio >= 0.4 ? 15 : 0,
        judgement: isCorrect ? "correct" : ratio >= 0.4 ? "partial" : "incorrect",
        feedback: { mode: "ai", aiEvaluated: false, wordCount: words.length },
      };
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
    points: 0,
    feedback: {
      mode: "literal",
      acceptableAnswers: [],
    },
  };
}

/**
 * Async validation — handles AI mode with API call, falls back gracefully.
 * Use this for all validation when AI might be involved.
 */
export async function validateAnswerAsync(
  answer: string,
  question: DutchQuestion,
  groepLevel?: string
): Promise<ValidationResult> {
  // AI mode with API available → call AI
  if (question.validation?.mode === "ai" && isAiAvailable()) {
    return evaluateWithAi(
      question.question,
      answer,
      question.validation as AiValidationConfig,
      groepLevel
    );
  }

  // All other modes → synchronous
  return validateAnswer(answer, question);
}
