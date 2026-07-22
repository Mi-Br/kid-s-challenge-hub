/**
 * AI Answer Evaluation for Dutch Reading Challenges
 *
 * Calls the `evaluate-answer` Lovable Cloud edge function which routes to
 * GPT via the Lovable AI Gateway. Returns a 3-state judgement:
 *   correct (25pts)  |  partial (15pts)  |  incorrect (0pts)
 *
 * If the edge function is unavailable, falls back to keyword matching on
 * `keyElements` so the challenge still works offline.
 */

import type { AiValidationConfig, AiJudgement, ValidationResult } from "@/types/validation";

async function getSupabase() {
  const { supabase } = await import("@/integrations/supabase/client");
  return supabase;
}

// ── Backwards-compatible shims (used to accept an Anthropic key) ──
// Kept as no-ops so existing call sites don't break.
export function setAiApiKey(_key: string) {
  // No-op — evaluation now runs server-side via Lovable AI Gateway.
}

export function isAiAvailable(): boolean {
  // AI evaluation is always available through the Lovable Cloud edge function.
  return true;
}

/**
 * Keyword-based fallback when the edge function fails.
 */
function fallbackKeywordCheck(
  studentAnswer: string,
  config: AiValidationConfig
): ValidationResult {
  const normalized = studentAnswer.toLowerCase().trim().replace(/[.,!?;]/g, "");
  const words = normalized.split(/\s+/).filter((w) => w.length > 0);

  if (words.length < config.minWords) {
    return {
      isCorrect: false,
      judgement: "incorrect",
      points: 0,
      feedback: {
        mode: "ai",
        aiEvaluated: false,
        aiFeedback: "Probeer wat meer te schrijven zodat ik je antwoord goed kan beoordelen.",
        wordCount: words.length,
      },
    };
  }

  let matched = 0;
  for (const element of config.keyElements) {
    const variants = element.split("/").map((v) => v.trim().toLowerCase());
    if (variants.some((v) => normalized.includes(v))) matched++;
  }

  const ratio = config.keyElements.length > 0 ? matched / config.keyElements.length : 0;

  let judgement: AiJudgement;
  let isCorrect: boolean;
  let points: number;
  let feedback: string;

  if (ratio >= 0.7) {
    judgement = "correct";
    isCorrect = true;
    points = 25;
    feedback = "Goed gedaan!";
  } else if (ratio >= 0.4) {
    judgement = "partial";
    isCorrect = false;
    points = 15;
    feedback = "Je bent op de goede weg, maar er mist nog iets belangrijks.";
  } else {
    judgement = "incorrect";
    isCorrect = false;
    points = 0;
    feedback = "Dat klopt nog niet helemaal. Lees de tekst nog eens goed door.";
  }

  return {
    isCorrect,
    judgement,
    points,
    feedback: {
      mode: "ai",
      aiEvaluated: false,
      aiFeedback: feedback,
      wordCount: words.length,
    },
  };
}

/**
 * Evaluate a student's answer using the edge function (GPT via Lovable AI Gateway).
 */
export async function evaluateWithAi(
  question: string,
  studentAnswer: string,
  config: AiValidationConfig,
  groepLevel?: string,
  storyText?: string
): Promise<ValidationResult> {
  const words = studentAnswer.trim().split(/\s+/).filter((w) => w.length > 0);

  // Reject too-short answers without hitting the API.
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

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.functions.invoke("evaluate-answer", {
      body: {
        question,
        studentAnswer,
        storyText,
        exampleAnswer: config.exampleAnswer,
        rubric: config.rubric,
        keyElements: config.keyElements,
        groepLevel,
      },
    });

    if (error) throw error;
    if (!data || !data.judgement) throw new Error("Invalid response from evaluator");

    const judgement = data.judgement as AiJudgement;
    const feedback = (data.feedback as string) || "";
    const points = judgement === "correct" ? 25 : judgement === "partial" ? 15 : 0;

    return {
      isCorrect: judgement === "correct",
      judgement,
      points,
      feedback: {
        mode: "ai",
        aiEvaluated: true,
        aiFeedback: feedback,
        wordCount: words.length,
      },
    };
  } catch (err) {
    console.warn("AI evaluation failed, falling back to keywords:", err);
    return fallbackKeywordCheck(studentAnswer, config);
  }
}
