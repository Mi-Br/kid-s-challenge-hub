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
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";
const MAX_TOKENS = 4096;
const DELAY_MS = 2000; // between API calls

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

// ═══════════════════════════════════════════════════════════
//  GENERATION PROMPT — mirrors AGENT.md spec exactly
// ═══════════════════════════════════════════════════════════
function buildPrompt(groepLevel, difficulty, topic) {
  // Read AGENT.md for the canonical spec
  const agentMdPath = path.join(__dirname, "AGENT.md");
  const agentMd = fs.readFileSync(agentMdPath, "utf-8");

  return `You are a Dutch language education specialist creating reading comprehension exercises for NT2 children (expats in the Netherlands learning Dutch as a second language).

Below is the complete specification for this project. Follow it precisely.

<specification>
${agentMd}
</specification>

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
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--groep": opts.groep = args[++i]; break;
      case "--difficulty": opts.difficulty = args[++i]; break;
      case "--topic": opts.topic = args[++i]; break;
      case "--count": opts.count = parseInt(args[++i], 10); break;
      case "--fill-gaps": opts.fillGaps = true; break;
      case "--list": opts.list = true; break;
      case "--dry-run": opts.dryRun = true; break;
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
  --fill-gaps           Auto-generate missing challenges for all groep/difficulty combos
  --list                Show current inventory and gaps
  --dry-run             Build prompts but don't call the API
  --help                Show this help

Examples:
  node scripts/generate-challenge-text.js --groep groep5-6 --difficulty medium --topic school
  node scripts/generate-challenge-text.js --groep groep7-8 --difficulty high --count 5
  node scripts/generate-challenge-text.js --fill-gaps --count 2
  node scripts/generate-challenge-text.js --list

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

  if (opts.list) {
    printInventory();
    return;
  }

  console.log("\n🇳🇱 Dutch Reading Challenge — Text Generator\n");

  // Build task list
  const tasks = [];

  if (opts.fillGaps) {
    const gaps = getGaps();
    if (gaps.length === 0) {
      console.log("✅ All targets met! Nothing to generate.\n");
      return;
    }
    for (const gap of gaps) {
      const toGenerate = Math.min(gap.missing, opts.count);
      const topics = TOPIC_BANK[gap.groep] || [];
      for (let i = 0; i < toGenerate; i++) {
        const topic = topics[i % topics.length]; // cycle through topics
        tasks.push({ groep: gap.groep, difficulty: gap.difficulty, topic });
      }
    }
    console.log(`📋 Fill-gaps mode: ${tasks.length} challenges to generate\n`);
  } else {
    if (!opts.groep || !opts.difficulty) {
      console.error("❌ --groep and --difficulty are required (or use --fill-gaps)\n");
      printHelp();
      process.exit(1);
    }
    for (let i = 0; i < opts.count; i++) {
      tasks.push({ groep: opts.groep, difficulty: opts.difficulty, topic: opts.topic });
    }
  }

  // Run tasks
  let success = 0;
  let failed = 0;

  for (let i = 0; i < tasks.length; i++) {
    const { groep, difficulty, topic } = tasks[i];
    const ref = DIFF_TO_REF[difficulty];
    const refIcon = { "toward-1F": "🟢", "1F": "🔵", "toward-1S/2F": "🟣" }[ref] || "⚪";

    console.log(`[${i + 1}/${tasks.length}] ${refIcon} ${groep} / ${difficulty} (${ref})${topic ? ` / ${topic}` : ""}`);

    if (opts.dryRun) {
      console.log("  ⏩ Dry run — skipping API call\n");
      continue;
    }

    try {
      const prompt = buildPrompt(groep, difficulty, topic);
      const challenge = await callAnthropic(prompt);
      const result = validate(challenge, groep, difficulty);

      if (!result.valid) {
        console.error(`  ❌ Validation failed:`);
        result.errors.forEach(e => console.error(`     ${e}`));
        failed++;
        continue;
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(w => console.warn(`  ⚠️  ${w}`));
      }

      const filepath = saveChallenge(challenge);
      console.log(`  ✅ Saved: ${path.basename(filepath)} (${result.stats.wordCount} words, ${result.stats.questionCount} questions)`);
      success++;

      // Delay between API calls
      if (i < tasks.length - 1) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    } catch (e) {
      console.error(`  ❌ Error: ${e.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Done: ${success} saved, ${failed} failed out of ${tasks.length} total\n`);
}

main().catch(e => {
  console.error("Fatal:", e.message);
  process.exit(1);
});
