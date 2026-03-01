#!/usr/bin/env node

/**
 * Dutch Reading Challenge — Text Generation Script
 *
 * Generates reading comprehension challenges calibrated to IEP referentieniveaus.
 * Reads spec from AGENT.md (same folder) — that file is the single source of truth.
 *
 * Usage:
 *   node scripts/generate-challenge-text.js --groep groep5-6 --difficulty medium --topic school
 *   node scripts/generate-challenge-text.js --groep groep7-8 --difficulty high --count 5
 *   node scripts/generate-challenge-text.js --fill-gaps --count 2
 *   node scripts/generate-challenge-text.js --list
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──────────────────────────────────────────────────
const CHALLENGES_DIR = path.join(__dirname, "../src/content/challenges/dutch-reading");
const TOPIC_LIBRARY_PATH = path.join(__dirname, "topic-library.json");
const STORY_ARCS_PATH = path.join(__dirname, "story-arcs.json");
const CONSTRAINTS_PATH = path.join(__dirname, "constraints.json");
const CHECKPOINTS_DIR = path.join(__dirname, "checkpoints");
const REPORTS_DIR = path.join(__dirname, "reports");
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const DELAY_MS = 2000; // between API calls
const CHECKPOINT_INTERVAL = 20; // Save checkpoint every N challenges

// ── Difficulty → referentieniveau mapping ────────────────────
const DIFF_TO_REF = { low: "toward-1F", medium: "1F", high: "toward-1S/2F" };

// ── Topic banks per groep ───────────────────────────────────
const TOPIC_BANK = {
  "groep4-5": ["dieren", "school", "familie", "eten", "spelen", "de buurt", "het weer", "kleding", "verjaardagen", "het lichaam"],
  "groep5-6": ["sport", "Nederlandse feestdagen", "vriendschap", "natuur", "beroepen", "verkeer", "seizoenen", "de bibliotheek", "huisdieren", "de markt"],
  "groep7-8": ["milieu", "wetenschap", "Nederlandse geschiedenis", "media", "gezondheid", "reizen", "cultuur", "technologie", "democratie", "wereldkeuken"],
};

// ── Target counts per cell ──────────────────────────────────
const TARGETS = {
  "groep4-5": { low: 10, medium: 10, high: 8 },
  "groep5-6": { low: 10, medium: 10, high: 8 },
  "groep7-8": { low: 8, medium: 8, high: 6 },
};

// ── Load variety data files ──────────────────────────────────
let TOPIC_LIBRARY = {};
let STORY_ARCS = {};
let CONSTRAINTS = {};

function loadVarietyData() {
  try {
    if (fs.existsSync(TOPIC_LIBRARY_PATH)) {
      TOPIC_LIBRARY = JSON.parse(fs.readFileSync(TOPIC_LIBRARY_PATH, "utf-8"));
      console.log(`  ✓ Loaded topic library (${Object.values(TOPIC_LIBRARY).reduce((a, b) => a + Object.values(b).reduce((c, d) => c + d.length, 0), 0)} sub-topics)`);
    }
    if (fs.existsSync(STORY_ARCS_PATH)) {
      STORY_ARCS = JSON.parse(fs.readFileSync(STORY_ARCS_PATH, "utf-8"));
      console.log(`  ✓ Loaded story arcs (${Object.values(STORY_ARCS).reduce((a, b) => a + b.length, 0)} arcs)`);
    }
    if (fs.existsSync(CONSTRAINTS_PATH)) {
      CONSTRAINTS = JSON.parse(fs.readFileSync(CONSTRAINTS_PATH, "utf-8"));
      console.log(`  ✓ Loaded constraints`);
    }
  } catch (e) {
    console.warn(`  ⚠️  Could not load variety data: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
//  RANDOMIZATION & VARIETY HELPERS
// ═══════════════════════════════════════════════════════════
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function generateTopicSequence(topics, count) {
  if (topics.length === 0) return [];
  const sequence = [];
  let pool = shuffle([...topics]);
  let poolIndex = 0;

  for (let i = 0; i < count; i++) {
    if (poolIndex >= pool.length) {
      pool = shuffle([...topics]);
      poolIndex = 0;
    }
    sequence.push(pool[poolIndex++]);
  }
  return sequence;
}

function selectRandomConstraints(groepLevel, difficulty, count = 2) {
  const constraintList = CONSTRAINTS[groepLevel]?.[difficulty] || [];
  if (constraintList.length === 0) return [];
  const shuffled = shuffle(constraintList);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function selectRandomArc(groepLevel) {
  const arcs = STORY_ARCS[groepLevel] || [];
  if (arcs.length === 0) return null;
  return arcs[Math.floor(Math.random() * arcs.length)];
}

function getSubtopicInfo(groepLevel, topicName) {
  const topicsPerParent = TOPIC_LIBRARY[groepLevel]?.[topicName] || [];
  if (topicsPerParent.length === 0) return null;
  return topicsPerParent[Math.floor(Math.random() * topicsPerParent.length)];
}

// ═══════════════════════════════════════════════════════════
//  GENERATION PROMPT — mirrors AGENT.md spec exactly
// ═══════════════════════════════════════════════════════════
function buildPrompt(groepLevel, difficulty, topic, topicSequence = null, sequenceIndex = null) {
  // Read AGENT.md for the canonical spec
  const agentMdPath = path.join(__dirname, "AGENT.md");
  const agentMd = fs.readFileSync(agentMdPath, "utf-8");

  // Select variety data if loaded
  let varietySection = "";
  if (Object.keys(STORY_ARCS).length > 0 || Object.keys(CONSTRAINTS).length > 0) {
    varietySection = "\n\n<VARIETY_GUIDELINES>";

    // Narrative arc
    const arc = selectRandomArc(groepLevel);
    if (arc) {
      varietySection += `\nNARRATIVE ARC: ${arc.name}`;
      varietySection += `\nStructure: ${arc.structure.join(" → ")}`;
      varietySection += `\nEmotional journey: ${arc.emotional_arc}`;
    }

    // Sub-topic details
    let effectiveTopic = topic;
    if (topicSequence && sequenceIndex !== null && sequenceIndex < topicSequence.length) {
      effectiveTopic = topicSequence[sequenceIndex];
    }
    const subtopic = getSubtopicInfo(groepLevel, effectiveTopic);
    if (subtopic) {
      varietySection += `\nSUB-TOPIC: ${subtopic.name}`;
      varietySection += `\nPossible settings: ${subtopic.settings.join(", ")}`;
      varietySection += `\nPossible conflicts: ${subtopic.conflicts.join(", ")}`;
      varietySection += `\nCharacter types: ${subtopic.characters.join(", ")}`;
    }

    // Constraints
    const constraints = selectRandomConstraints(groepLevel, difficulty, 2);
    if (constraints.length > 0) {
      varietySection += `\nSTYLISTIC CONSTRAINTS (apply these):`;
      constraints.forEach((c, i) => {
        varietySection += `\n${i + 1}. ${c.constraint}`;
      });
    }

    varietySection += "\n</VARIETY_GUIDELINES>";
  }

  return `You are a Dutch language education specialist creating reading comprehension exercises for NT2 children (expats in the Netherlands learning Dutch as a second language).

Below is the complete specification for this project. Follow it precisely.

<specification>
${agentMd}
</specification>
${varietySection}

TASK: Generate exactly ONE challenge with these parameters:
- groepLevel: ${groepLevel}
- difficulty: ${difficulty}
- referentieNiveau: ${DIFF_TO_REF[difficulty]}
${topic ? `- topic: ${topic}` : "- topic: pick an engaging one from the topic bank for this groep"}

Follow ALL specs from the document above:
- Text characteristics must match the referentieniveau (${DIFF_TO_REF[difficulty]})
- Word count, sentence length, grammar, vocabulary must be within the ranges for ${groepLevel} ${difficulty}
- Question count and type distribution must match the table for ${groepLevel} ${difficulty}
- Every literal answer must appear verbatim in the text
- Every keyword group must have 3+ synonyms including verb conjugations
- Hints point to the right paragraph without giving the answer
- acceptableAnswers are always lowercase
- Include exactly 2 imagePrompts in English

Return ONLY valid JSON matching the schema in the spec. No markdown fences, no explanation, no preamble.`;
}

// ═══════════════════════════════════════════════════════════
//  API CALL
// ═══════════════════════════════════════════════════════════
async function callAnthropic(prompt) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not set in .env — add it next to GOOGLE_API_KEY");
  }

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
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err}`);
  }

  const data = await res.json();
  const raw = data.content?.map(b => b.text || "").join("") || "";

  // Strip markdown fences if the model wraps them
  const cleaned = raw.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON response:");
    console.error(cleaned.substring(0, 500));
    throw new Error(`JSON parse error: ${e.message}`);
  }
}

// ═══════════════════════════════════════════════════════════
//  QUALITY CONTROL & ENHANCED VALIDATION
// ═══════════════════════════════════════════════════════════
const DUTCH_CLICHÉS = [
  "op een dag", "lang geleden", "heel erg", "veel te", "eigenlijk",
  "ineens", "plotseling", "opeens", "er was eens", "ze waren erg",
  "eerst daarna", "ten slotte", "aan het eind", "in het eind",
  "helemaal niet", "totaal niet", "echt niet", "absoluut",
];

function detectCliches(text) {
  const textLower = text.toLowerCase();
  let clicheCount = 0;
  const found = [];
  for (const cliche of DUTCH_CLICHÉS) {
    if (textLower.includes(cliche)) {
      clicheCount++;
      found.push(cliche);
    }
  }
  return { count: clicheCount, found };
}

function assessComplexity(text, groepLevel, difficulty) {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/);
  const avgSentenceLength = words.length / sentences.length;

  // Expected avg sentence length by groep and difficulty
  const expectedLength = {
    "groep4-5": { low: 8, medium: 10, high: 12 },
    "groep5-6": { low: 10, medium: 13, high: 15 },
    "groep7-8": { low: 14, medium: 17, high: 20 },
  };

  const target = expectedLength[groepLevel]?.[difficulty] || 12;
  const tolerance = target * 0.3; // ±30% tolerance
  const matches = avgSentenceLength >= target - tolerance && avgSentenceLength <= target + tolerance;

  return {
    avgSentenceLength: avgSentenceLength.toFixed(1),
    expectedLength: target,
    matches,
    assessment: matches ? "✓ Matches" : avgSentenceLength > target ? "⚠ Too complex" : "⚠ Too simple",
  };
}

function validateEnhanced(challenge, groepLevel, difficulty, existingChallenges = []) {
  const baseValidation = validate(challenge, groepLevel, difficulty);
  const enhancements = {
    cliches: detectCliches(challenge.text),
    complexity: assessComplexity(challenge.text, groepLevel, difficulty),
    titleUnique: !existingChallenges.some(c => c.id === challenge.id),
  };

  if (!enhancements.titleUnique) {
    baseValidation.warnings.push(`Title conflict: ID "${challenge.id}" already exists`);
  }
  if (enhancements.cliches.count > 2) {
    baseValidation.warnings.push(`Contains ${enhancements.cliches.count} clichés: ${enhancements.cliches.found.join(", ")}`);
  }

  return { ...baseValidation, enhancements };
}

function generateQualityReport(challenges, groepLevel) {
  if (!fs.existsSync(REPORTS_DIR)) {
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
  }

  const topics = TOPIC_BANK[groepLevel] || [];
  const topicCount = {};
  topics.forEach(t => topicCount[t] = 0);

  const arcs = STORY_ARCS[groepLevel] || [];
  const arcCount = {};
  arcs.forEach(a => arcCount[a.id] = 0);

  let totalCliches = 0;
  let complexityMatches = 0;
  let imageCompletion = 0;

  for (const ch of challenges) {
    if (ch.topic) topicCount[ch.topic]++;
    totalCliches += detectCliches(ch.text).count;
    const complexity = assessComplexity(ch.text, groepLevel, ch.difficulty);
    if (complexity.matches) complexityMatches++;
    if (ch.images?.length === 2) imageCompletion++;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    groepLevel,
    totalChallenges: challenges.length,
    statistics: {
      topicDistribution: topicCount,
      averageCliches: (totalCliches / challenges.length).toFixed(2),
      complexityMatchRate: ((complexityMatches / challenges.length) * 100).toFixed(1) + "%",
      imageCompletionRate: ((imageCompletion / challenges.length) * 100).toFixed(1) + "%",
    },
    qualityScore: {
      high: complexityMatches > challenges.length * 0.8 && imageCompletion === challenges.length ? "✅ Good" : "⚠️ Needs review",
    },
  };

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const reportFile = path.join(REPORTS_DIR, `quality-${groepLevel}-${timestamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2), "utf-8");

  return report;
}

// ═══════════════════════════════════════════════════════════
//  AUTO-FIX: Convert woordbetekenis from literal to keywords
// ═══════════════════════════════════════════════════════════
function fixWordbetekensisQuestions(challenge) {
  /**
   * Auto-fix: woordbetekenis questions work better with keywords validation
   * because word definitions are inferred from context, not exact string matches.
   *
   * Converts: literal answers → keywords groups with synonyms
   * Example: "langzaam en zacht" → ["langzaam", "zacht"] as keyword groups
   */
  if (!challenge.questions) return challenge;

  const fixed = { ...challenge };
  fixed.questions = challenge.questions.map(q => {
    // Only fix woordbetekenis questions with literal answers
    if (q.questionType === "woordbetekenis" && q.acceptableAnswers && !q.validation) {
      // Convert acceptableAnswers to keyword groups
      // Split each answer by common conjunctions and create groups
      const keywordGroups = q.acceptableAnswers
        .flatMap(answer =>
          answer.split(/\s+(en|of|,)\s+/).filter(w => w && !['en', 'of', ','].includes(w))
        )
        .filter((v, i, a) => a.indexOf(v) === i) // unique
        .map(word => [word]) // wrap each in array
        .slice(0, 3); // limit to 3 groups for simplicity

      return {
        ...q,
        answerType: "explanation",
        validation: {
          mode: "keywords",
          minWords: 1,
          mustIncludeAny: keywordGroups.length > 0 ? keywordGroups : [q.acceptableAnswers],
          allowExtraText: true
        },
        // Remove old acceptableAnswers since we're using validation now
        acceptableAnswers: undefined
      };
    }
    return q;
  });

  return fixed;
}

function autoFixLiteralAnswers(challenge) {
  /**
   * Auto-fix: convert problematic literal questions to keywords validation
   *
   * Problem patterns:
   * 1. "Wat roept/zegt/doet..." questions where exact quote doesn't appear
   * 2. "Waarom..." questions where specific reason doesn't appear verbatim
   *
   * Solution: Use keywords validation instead of literal
   */
  if (!challenge.questions) return challenge;

  const fixed = { ...challenge };
  fixed.questions = challenge.questions.map(q => {
    // Only fix if:
    // - Has literal answers (acceptableAnswers)
    // - No custom validation yet
    // - Question pattern suggests indirect answers
    if (!q.acceptableAnswers || q.validation || q.answerType) {
      return q;
    }

    const qText = q.question.toLowerCase();

    // Convert these patterns to keywords (harder to get exact literal matches)
    const shouldConvert =
      qText.includes("roept") ||      // Wat roept...
      qText.includes("zegt") ||       // Wat zegt...
      qText.includes("doet") ||       // Wat doet...
      qText.includes("waarom") ||     // Waarom...
      qText.includes("hoe voelt") ||  // Hoe voelt...
      qText.includes("hoe") ||        // Hoe...
      (qText.includes("wat") && qText.length > 50); // Long questions are usually complex

    if (!shouldConvert) {
      return q;
    }

    // Convert to keywords validation
    // Extract key words from acceptable answers
    const keywords = q.acceptableAnswers[0]
      .split(/\s+/)
      .filter(w => w.length > 3) // only significant words
      .slice(0, 3);

    if (keywords.length === 0) {
      return q; // fallback to original if no keywords extracted
    }

    return {
      ...q,
      answerType: "explanation",
      validation: {
        mode: "keywords",
        minWords: 2,
        mustIncludeAny: keywords.map(kw => [kw]),
        allowExtraText: true
      },
      acceptableAnswers: undefined
    };
  });

  return fixed;
}

// ═══════════════════════════════════════════════════════════
//  VALIDATION
// ═══════════════════════════════════════════════════════════
function validate(challenge, groepLevel, difficulty) {
  const errors = [];
  const warnings = [];

  // Required fields
  for (const field of ["id", "title", "text", "groepLevel", "difficulty", "questions", "images"]) {
    if (!challenge[field]) errors.push(`Missing required field: ${field}`);
  }

  if (errors.length > 0) return { valid: false, errors, warnings };

  // Groep/difficulty match
  if (challenge.groepLevel !== groepLevel) errors.push(`groepLevel mismatch: got ${challenge.groepLevel}, expected ${groepLevel}`);
  if (challenge.difficulty !== difficulty) errors.push(`difficulty mismatch: got ${challenge.difficulty}, expected ${difficulty}`);

  // Word count ranges
  const wordCount = challenge.text.split(/\s+/).length;
  const ranges = {
    "groep4-5": { low: [40, 60], medium: [60, 90], high: [90, 120] },
    "groep5-6": { low: [80, 120], medium: [120, 160], high: [160, 220] },
    "groep7-8": { low: [160, 220], medium: [220, 300], high: [300, 400] },
  };
  const [min, max] = ranges[groepLevel]?.[difficulty] || [0, 9999];
  if (wordCount < min * 0.8) errors.push(`Word count too low: ${wordCount} (min: ${min})`);
  if (wordCount > max * 1.2) warnings.push(`Word count slightly over: ${wordCount} (max: ${max})`);

  // Question count
  const qCount = challenge.questions?.length || 0;
  const qRanges = {
    "groep4-5": { low: [3, 3], medium: [3, 3], high: [4, 4] },
    "groep5-6": { low: [3, 4], medium: [4, 4], high: [5, 5] },
    "groep7-8": { low: [4, 5], medium: [5, 5], high: [5, 6] },
  };
  const [qMin, qMax] = qRanges[groepLevel]?.[difficulty] || [3, 6];
  if (qCount < qMin) warnings.push(`Only ${qCount} questions (expected ${qMin}-${qMax})`);
  if (qCount > qMax + 1) warnings.push(`Too many questions: ${qCount} (expected ${qMin}-${qMax})`);

  // Literal answer check
  const textLower = challenge.text.toLowerCase();
  for (const q of challenge.questions || []) {
    if (q.acceptableAnswers && !q.answerType) {
      const hasMatch = q.acceptableAnswers.some(a => textLower.includes(a.toLowerCase()));
      if (!hasMatch) errors.push(`Literal answer not found in text: "${q.acceptableAnswers[0]}" for Q: "${q.question}"`);
    }
  }

  // Keyword synonym count
  for (const q of challenge.questions || []) {
    if (q.validation?.mustIncludeAny) {
      for (const group of q.validation.mustIncludeAny) {
        if (group.length < 3) warnings.push(`Keyword group has <3 synonyms: [${group.join(", ")}] in Q: "${q.question}"`);
      }
    }
  }

  // AI validation config check
  for (const q of challenge.questions || []) {
    if (q.validation?.mode === "ai") {
      if (!q.validation.rubric) errors.push(`AI question missing rubric: "${q.question}"`);
      if (!q.validation.exampleAnswer) errors.push(`AI question missing exampleAnswer: "${q.question}"`);
      if (!q.validation.keyElements?.length) errors.push(`AI question missing keyElements: "${q.question}"`);
      if (!q.validation.minWords) warnings.push(`AI question missing minWords: "${q.question}"`);
    }
  }

  // Images
  if (challenge.images?.length !== 2) warnings.push(`Expected 2 images, got ${challenge.images?.length}`);
  if (challenge.imagePrompts?.length !== 2) warnings.push(`Expected 2 imagePrompts, got ${challenge.imagePrompts?.length}`);

  // ID check
  const expectedId = challenge.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (challenge.id !== expectedId) warnings.push(`ID "${challenge.id}" doesn't match slugified title "${expectedId}"`);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    stats: { wordCount, questionCount: qCount },
  };
}

// ═══════════════════════════════════════════════════════════
//  INVENTORY
// ═══════════════════════════════════════════════════════════
function getExistingChallenges() {
  if (!fs.existsSync(CHALLENGES_DIR)) return [];
  return fs.readdirSync(CHALLENGES_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(CHALLENGES_DIR, f), "utf-8"));
        return {
          file: f,
          id: data.id,
          groepLevel: data.groepLevel || null,
          difficulty: data.difficulty || null,
          topic: data.topic || null,
          title: data.title,
        };
      } catch {
        return { file: f, id: f.replace(".json", ""), groepLevel: null, difficulty: null };
      }
    });
}

function getGaps() {
  const existing = getExistingChallenges();
  const gaps = [];

  for (const [groep, diffs] of Object.entries(TARGETS)) {
    for (const [diff, target] of Object.entries(diffs)) {
      const count = existing.filter(c => c.groepLevel === groep && c.difficulty === diff).length;
      if (count < target) {
        gaps.push({ groep, difficulty: diff, have: count, need: target, missing: target - count });
      }
    }
  }
  return gaps;
}

// ═══════════════════════════════════════════════════════════
//  SAVE
// ═══════════════════════════════════════════════════════════
function saveChallenge(challenge) {
  if (!fs.existsSync(CHALLENGES_DIR)) {
    fs.mkdirSync(CHALLENGES_DIR, { recursive: true });
  }

  const filename = `${challenge.id}.json`;
  const filepath = path.join(CHALLENGES_DIR, filename);

  if (fs.existsSync(filepath)) {
    console.warn(`  ⚠️  File already exists: ${filename} — saving as ${challenge.id}-new.json`);
    const newPath = path.join(CHALLENGES_DIR, `${challenge.id}-new.json`);
    fs.writeFileSync(newPath, JSON.stringify(challenge, null, 2), "utf-8");
    return newPath;
  }

  fs.writeFileSync(filepath, JSON.stringify(challenge, null, 2), "utf-8");
  return filepath;
}

// ═══════════════════════════════════════════════════════════
//  BATCH OPERATIONS
// ═══════════════════════════════════════════════════════════
function planBatch(targetCount, groepLevel) {
  const topics = TOPIC_BANK[groepLevel] || [];
  const topicSequence = generateTopicSequence(topics, targetCount);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);

  const plan = {
    timestamp,
    groepLevel,
    targetCount,
    topicSequence,
    estimatedApiCalls: targetCount,
    estimatedTokensPerCall: 3000,
    estimatedCost: (targetCount * 0.03).toFixed(2), // ~$0.03 per challenge
    estimatedTimeMinutes: Math.ceil(targetCount * 1.5), // ~1.5 min per challenge
  };

  return plan;
}

function saveBatchCheckpoint(plan, completed, failed, results) {
  if (!fs.existsSync(CHECKPOINTS_DIR)) {
    fs.mkdirSync(CHECKPOINTS_DIR, { recursive: true });
  }

  const checkpoint = {
    plan,
    completedCount: completed,
    failedIndices: failed,
    resultsCount: results.length,
    lastSaved: new Date().toISOString(),
  };

  const checkpointFile = path.join(CHECKPOINTS_DIR, `batch-${plan.groepLevel}-${plan.timestamp}.json`);
  fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2), "utf-8");
  return checkpointFile;
}

function resumeBatchCheckpoint(checkpointFile) {
  if (!fs.existsSync(checkpointFile)) {
    throw new Error(`Checkpoint file not found: ${checkpointFile}`);
  }
  return JSON.parse(fs.readFileSync(checkpointFile, "utf-8"));
}

function estimateCost(count) {
  const textCost = count * 0.03; // Text generation cost
  const imageCost = count * 0.08; // Image generation cost (2 per challenge)
  const totalCost = textCost + imageCost;
  const estimatedTimeMinutes = Math.ceil(count * 2); // 2 min avg per challenge

  return {
    textCost: textCost.toFixed(2),
    imageCost: imageCost.toFixed(2),
    totalCost: totalCost.toFixed(2),
    estimatedTimeMinutes,
  };
}

// ═══════════════════════════════════════════════════════════
//  CLI
// ═══════════════════════════════════════════════════════════
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    groep: null,
    difficulty: null,
    topic: null,
    count: 1,
    fillGaps: false,
    list: false,
    dryRun: false,
    planBatch: false,
    batch: false,
    target: null,
    resume: null,
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--groep": opts.groep = args[++i]; break;
      case "--difficulty": opts.difficulty = args[++i]; break;
      case "--topic": opts.topic = args[++i]; break;
      case "--count": opts.count = parseInt(args[++i], 10); break;
      case "--target": opts.target = parseInt(args[++i], 10); break;
      case "--fill-gaps": opts.fillGaps = true; break;
      case "--list": opts.list = true; break;
      case "--dry-run": opts.dryRun = true; break;
      case "--plan-batch": opts.planBatch = true; break;
      case "--batch": opts.batch = true; break;
      case "--resume": opts.resume = args[++i]; break;
      case "--help": printHelp(); process.exit(0);
      default: console.warn(`Unknown arg: ${args[i]}`);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`
Dutch Reading Challenge — Text Generator

Usage:
  node scripts/generate-challenge-text.js [options]

Options:
  --groep <level>       groep4-5, groep5-6, or groep7-8
  --difficulty <diff>   low, medium, or high
  --topic <topic>       Optional topic (e.g., school, dieren)
  --count <n>           Number of challenges to generate (default: 1)
  --target <n>          Target count for batch operations
  --fill-gaps           Auto-generate missing challenges for all groep/difficulty combos
  --list                Show current inventory and gaps
  --dry-run             Build prompts but don't call the API
  --plan-batch          Show batch plan and cost estimate (requires --groep and --target)
  --batch               Execute batch generation with checkpoints (requires --groep and --target)
  --resume <file>       Resume from checkpoint file
  --help                Show this help

Examples:
  node scripts/generate-challenge-text.js --groep groep5-6 --difficulty medium --topic school
  node scripts/generate-challenge-text.js --groep groep7-8 --difficulty high --count 5
  node scripts/generate-challenge-text.js --fill-gaps --count 2
  node scripts/generate-challenge-text.js --list
  node scripts/generate-challenge-text.js --plan-batch --groep groep4-5 --target 100
  node scripts/generate-challenge-text.js --batch --groep groep4-5 --target 100
  node scripts/generate-challenge-text.js --resume checkpoints/batch-groep4-5-2026-02-28T14-30-15.json

Environment:
  ANTHROPIC_API_KEY     Required in .env file
`);
}

function printInventory() {
  const existing = getExistingChallenges();
  const gaps = getGaps();

  console.log("\n📚 Current Inventory\n");

  // Count matrix
  for (const groep of ["groep4-5", "groep5-6", "groep7-8"]) {
    console.log(`  ${groep}:`);
    for (const diff of ["low", "medium", "high"]) {
      const count = existing.filter(c => c.groepLevel === groep && c.difficulty === diff).length;
      const target = TARGETS[groep][diff];
      const icon = count >= target ? "✅" : count > 0 ? "🔶" : "❌";
      console.log(`    ${icon} ${diff.padEnd(8)} ${count}/${target}`);
    }
  }

  // Unclassified
  const unclassified = existing.filter(c => !c.groepLevel);
  if (unclassified.length > 0) {
    console.log(`\n  ⚠️  Unclassified (no groepLevel): ${unclassified.length}`);
    unclassified.forEach(c => console.log(`    - ${c.file}`));
  }

  // Gaps
  if (gaps.length > 0) {
    console.log("\n📊 Gaps to fill:\n");
    for (const g of gaps) {
      console.log(`  ${g.groep} ${g.difficulty.padEnd(8)} need ${g.missing} more (have ${g.have}/${g.need})`);
    }
  } else {
    console.log("\n✅ All targets met!");
  }
  console.log("");
}

// ═══════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════
async function main() {
  const opts = parseArgs();

  console.log("\n🇳🇱 Dutch Reading Challenge — Text Generator\n");

  // Load variety data
  if (Object.keys(STORY_ARCS).length === 0 && Object.keys(CONSTRAINTS).length === 0) {
    console.log("📚 Loading variety data...");
    loadVarietyData();
  }

  if (opts.list) {
    printInventory();
    return;
  }

  // Handle batch planning
  if (opts.planBatch) {
    if (!opts.groep || !opts.target) {
      console.error("❌ --plan-batch requires --groep and --target\n");
      printHelp();
      process.exit(1);
    }
    const plan = planBatch(opts.target, opts.groep);
    const cost = estimateCost(opts.target);
    console.log(`\n📋 Batch Plan: ${opts.groep} (${opts.target} challenges)\n`);
    console.log(`  Topic sequence: ${plan.topicSequence.slice(0, 5).join(", ")} ...`);
    console.log(`  Estimated API calls: ${plan.estimatedApiCalls}`);
    console.log(`  Estimated cost: $${cost.totalCost}`);
    console.log(`  Estimated time: ${cost.estimatedTimeMinutes} minutes\n`);
    return;
  }

  // Handle batch resume
  if (opts.resume) {
    console.log(`🔄 Resuming from: ${opts.resume}\n`);
    try {
      const checkpoint = resumeBatchCheckpoint(opts.resume);
      console.log(`  Progress: ${checkpoint.completedCount}/${checkpoint.plan.targetCount} completed`);
      console.log(`  Failed: ${checkpoint.failedIndices.length}`);
      console.log(`  Last saved: ${checkpoint.lastSaved}\n`);
      // TODO: Implement actual resume logic in task generation
      return;
    } catch (e) {
      console.error(`❌ Error resuming: ${e.message}\n`);
      process.exit(1);
    }
  }

  // Handle batch execution
  if (opts.batch) {
    if (!opts.groep || !opts.target) {
      console.error("❌ --batch requires --groep and --target\n");
      printHelp();
      process.exit(1);
    }
    opts.count = opts.target;
    console.log(`🚀 Batch mode: ${opts.groep} (${opts.target} challenges)\n`);
  }

  // Build task list
  const tasks = [];
  let topicSequence = null;
  let sequenceIndices = {};

  if (opts.fillGaps) {
    const gaps = getGaps();
    if (gaps.length === 0) {
      console.log("✅ All targets met! Nothing to generate.\n");
      return;
    }
    for (const gap of gaps) {
      const toGenerate = Math.min(gap.missing, opts.count);
      const topics = TOPIC_BANK[gap.groep] || [];
      // Use randomized topic sequence instead of cycling
      const gapSequence = generateTopicSequence(topics, toGenerate);
      for (let i = 0; i < toGenerate; i++) {
        tasks.push({ groep: gap.groep, difficulty: gap.difficulty, topic: gapSequence[i], sequenceIndex: i });
      }
    }
    console.log(`📋 Fill-gaps mode: ${tasks.length} challenges to generate\n`);
  } else {
    if (!opts.groep || !opts.difficulty) {
      console.error("❌ --groep and --difficulty are required (or use --fill-gaps)\n");
      printHelp();
      process.exit(1);
    }
    const topics = TOPIC_BANK[opts.groep] || [];
    topicSequence = generateTopicSequence(topics, opts.count);
    for (let i = 0; i < opts.count; i++) {
      tasks.push({
        groep: opts.groep,
        difficulty: opts.difficulty,
        topic: opts.topic || topicSequence[i],
        sequenceIndex: i
      });
    }
  }

  // Run tasks
  let success = 0;
  let failed = 0;
  const failedIndices = [];
  const results = [];

  for (let i = 0; i < tasks.length; i++) {
    const { groep, difficulty, topic, sequenceIndex } = tasks[i];
    const ref = DIFF_TO_REF[difficulty];
    const refIcon = { "toward-1F": "🟢", "1F": "🔵", "toward-1S/2F": "🟣" }[ref] || "⚪";

    console.log(`[${i + 1}/${tasks.length}] ${refIcon} ${groep} / ${difficulty} (${ref})${topic ? ` / ${topic}` : ""}`);

    if (opts.dryRun) {
      console.log("  ⏩ Dry run — skipping API call\n");
      continue;
    }

    try {
      // Pass topic sequence and index to buildPrompt for variety features
      const sequenceForThisGroep = topicSequence && groep === opts.groep ? topicSequence : null;
      const prompt = buildPrompt(groep, difficulty, topic, sequenceForThisGroep, sequenceIndex);
      let challenge = await callAnthropic(prompt);

      // Auto-fix: convert woordbetekenis to keywords validation
      challenge = fixWordbetekensisQuestions(challenge);

      // Auto-fix: convert problematic literal questions (quotes, reasons) to keywords
      challenge = autoFixLiteralAnswers(challenge);

      const result = validate(challenge, groep, difficulty);

      if (!result.valid) {
        console.error(`  ❌ Validation failed:`);
        result.errors.forEach(e => console.error(`     ${e}`));
        failed++;
        failedIndices.push(i);
        continue;
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));
      }

      const filepath = saveChallenge(challenge);
      console.log(`  ✅ Saved: ${path.basename(filepath)} (${result.stats.wordCount} words, ${result.stats.questionCount} questions)`);
      success++;
      results.push({ index: i, id: challenge.id, filepath });

      // Save checkpoint periodically for batch mode
      if (opts.batch && (success + failed) % CHECKPOINT_INTERVAL === 0) {
        const plan = planBatch(opts.target, opts.groep);
        const checkpointFile = saveBatchCheckpoint(plan, success + failed, failedIndices, results);
        console.log(`  💾 Checkpoint saved: ${path.basename(checkpointFile)}`);
      }

      // Delay between API calls
      if (i < tasks.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    } catch (e) {
      console.error(`  ❌ Error: ${e.message}`);
      failed++;
      failedIndices.push(i);
    }
  }

  console.log(`\n📊 Done: ${success} saved, ${failed} failed out of ${tasks.length} total\n`);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
