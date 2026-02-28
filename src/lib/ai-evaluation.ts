/**
 * AI Answer Evaluation for Dutch Reading Challenges
 *
 * Calls Anthropic API (Haiku) to evaluate open-ended answers
 * that can't be validated with simple keyword matching.
 *
 * Used for: hoofdgedachte, evalueren, samenvatten, schrijversdoel,
 * and complex interpreteren questions at groep5-6 high / groep7-8 medium+high.
 *
 * Design choices:
 * - Haiku for speed (<1s) and low cost (~$0.001 per evaluation)
 * - Prompt is minimal: ~200 tokens input → ~60 tokens output
 * - Three-tier scoring: correct (25pts), partial (15pts), incorrect (0pts)
 * - Feedback is in Dutch, encouraging, age-appropriate
 * - Falls back to keyword matching if API unavailable
 */

import type { AiValidationConfig, AiJudgement, ValidationResult } from "@/types/validation";

const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 150; // Keep responses short

/**
 * Build the evaluation prompt.
 * Deliberately minimal — every token costs latency.
 */
function buildEvalPrompt(
  question: string,
  studentAnswer: string,
  config: AiValidationConfig,
  groepLevel?: string
): string {
  const levelHint = groepLevel
    ? `De leerling zit in ${groepLevel} (NT2 — Nederlands als tweede taal).`
    : "De leerling is een NT2-leerder.";

  return `Beoordeel het antwoord van een leerling op een Nederlands begrijpend-lezen vraag.

${levelHint}

Vraag: ${question}
Goed antwoord (voorbeeld): ${config.exampleAnswer}
Beoordelingscriteria: ${config.rubric}
Kernelementen: ${config.keyElements.join("; ")}

Antwoord leerling: "${studentAnswer}"

Beoordeel als JSON: {"judgement":"correct"|"partial"|"incorrect","feedback":"<1 zin in eenvoudig Nederlands, bemoedigend>"}

correct = de kern is begrepen (woorden hoeven niet exact te zijn)
partial = deels goed maar mist een belangrijk element
incorrect = niet juist of te vaag

Alleen JSON, geen uitleg.`;
}

/**
 * Call Anthropic API for answer evaluation
 */
async function callApi(prompt: string, apiKey: string): Promise<{
  judgement: AiJudgement;
  feedback: string;
}> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content?.map((b: { text?: string }) => b.text || "").join("") || "";
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (!["correct", "partial", "incorrect"].includes(parsed.judgement)) {
      throw new Error("Invalid judgement value");
    }
    return {
      judgement: parsed.judgement as AiJudgement,
      feedback: parsed.feedback || "",
    };
  } catch {
    // If parsing fails, try to infer from text
    const lower = cleaned.toLowerCase();
    if (lower.includes('"correct"') && !lower.includes('"incorrect"')) {
      return { judgement: "correct", feedback: "Goed gedaan!" };
    }
    if (lower.includes('"partial"')) {
      return { judgement: "partial", feedback: "Je bent op de goede weg!" };
    }
    return { judgement: "incorrect", feedback: "Probeer het nog eens." };
  }
}

/**
 * Keyword-based fallback when API is unavailable.
 * Uses keyElements from the AI config as simple keyword groups.
 */
function fallbackKeywordCheck(
  studentAnswer: string,
  config: AiValidationConfig
): ValidationResult {
  const normalized = studentAnswer.toLowerCase().trim().replace(/[.,!?;]/g, "");
  const words = normalized.split(/\s+/).filter(w => w.length > 0);

  if (words.length < config.minWords) {
    return {
      isCorrect: false,
      judgement: "incorrect",
      points: 0,
      feedback: {
        mode: "ai",
        aiEvaluated: false,
        wordCount: words.length,
      },
    };
  }

  // Each keyElement is like "doorzetten/volhouden/niet opgeven"
  // Check how many elements have at least one match
  let matched = 0;
  for (const element of config.keyElements) {
    const variants = element.split("/").map(v => v.trim().toLowerCase());
    if (variants.some(v => normalized.includes(v))) {
      matched++;
    }
  }

  const ratio = config.keyElements.length > 0 ? matched / config.keyElements.length : 0;

  let judgement: AiJudgement;
  let isCorrect: boolean;
  let points: number;

  if (ratio >= 0.7) {
    judgement = "correct";
    isCorrect = true;
    points = 25;
  } else if (ratio >= 0.4) {
    judgement = "partial";
    isCorrect = false; // Not fully correct but partial credit
    points = 15;
  } else {
    judgement = "incorrect";
    isCorrect = false;
    points = 0;
  }

  return {
    isCorrect,
    judgement,
    points,
    feedback: {
      mode: "ai",
      aiEvaluated: false,
      wordCount: words.length,
    },
  };
}

// ── Configuration ──

let _apiKey: string | null = null;

/**
 * Set the Anthropic API key for AI evaluation.
 * Call this once on app startup (e.g., from env or settings).
 */
export function setAiApiKey(key: string) {
  _apiKey = key;
}

/**
 * Check if AI evaluation is available (API key is set).
 */
export function isAiAvailable(): boolean {
  return !!_apiKey;
}

/**
 * Evaluate a student's answer using AI.
 *
 * @param question - The question text
 * @param studentAnswer - The student's answer
 * @param config - AI validation config from the challenge JSON
 * @param groepLevel - Optional groep level for age-appropriate feedback
 * @returns ValidationResult with judgement and Dutch feedback
 */
export async function evaluateWithAi(
  question: string,
  studentAnswer: string,
  config: AiValidationConfig,
  groepLevel?: string
): Promise<ValidationResult> {
  const words = studentAnswer.trim().split(/\s+/).filter(w => w.length > 0);

  // Quick reject: too few words (no API call needed)
  if (words.length < config.minWords) {
    return {
      isCorrect: false,
      judgement: "incorrect",
      points: 0,
      feedback: {
        mode: "ai",
        aiEvaluated: false,
        aiFeedback: "Probeer wat meer te schrijven!",
        wordCount: words.length,
      },
    };
  }

  // Try AI evaluation
  if (_apiKey) {
    try {
      const prompt = buildEvalPrompt(question, studentAnswer, config, groepLevel);
      const result = await callApi(prompt, _apiKey);

      const points = result.judgement === "correct" ? 25
        : result.judgement === "partial" ? 15
        : 0;

      return {
        isCorrect: result.judgement === "correct",
        judgement: result.judgement,
        points,
        feedback: {
          mode: "ai",
          aiEvaluated: true,
          aiFeedback: result.feedback,
          wordCount: words.length,
        },
      };
    } catch (err) {
      console.warn("AI evaluation failed, falling back to keywords:", err);
      // Fall through to keyword fallback
    }
  }

  // Fallback: keyword matching using keyElements
  return fallbackKeywordCheck(studentAnswer, config);
}
