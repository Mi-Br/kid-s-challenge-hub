# Challenge Generation Scripts

This folder contains everything needed to generate Dutch reading challenges — text content and images.

## Architecture

```
scripts/
├── AGENT.md                        ← Source of truth: full spec, schema, IEP calibration
├── generate-challenge-text.js      ← Text generation (calls Anthropic API)
├── generate-challenge-images.js    ← Image generation (calls Gemini API)
├── retry-missing-images.js         ← Retry failed image generations
└── README.md                       ← You are here
```

**AGENT.md** is the single source of truth. Both the script and any AI agent (Claude, GPT, etc.) read it for the complete specification — referentieniveaus, schema, question types, word counts, everything. The script literally loads AGENT.md and feeds it to the LLM as context.

## Prerequisites

```bash
npm install                    # install dependencies
cp .env.example .env           # create env file
```

Edit `.env`:
```
GOOGLE_API_KEY=your-gemini-key     # for image generation
ANTHROPIC_API_KEY=your-claude-key  # for text generation
```

## Text Generation

### With the script (batch mode)

```bash
# Generate one specific challenge
node scripts/generate-challenge-text.js --groep groep5-6 --difficulty medium --topic school

# Generate 5 high-difficulty groep 7-8 challenges
node scripts/generate-challenge-text.js --groep groep7-8 --difficulty high --count 5

# Auto-fill missing challenges (reads targets from AGENT.md)
node scripts/generate-challenge-text.js --fill-gaps --count 2

# See current inventory and gaps
node scripts/generate-challenge-text.js --list

# Dry run (build prompts without calling API)
node scripts/generate-challenge-text.js --groep groep4-5 --difficulty low --dry-run
```

The script:
1. Reads `AGENT.md` for the full generation spec
2. Calls Claude (Sonnet) with groep/difficulty/topic parameters
3. Validates the response (word count, question types, literal answers in text, etc.)
4. Saves valid JSON to `src/content/challenges/dutch-reading/`

### With an AI agent (interactive mode)

Point any agent at `scripts/AGENT.md`:

```
"Read scripts/AGENT.md and generate 3 groep 5-6 medium challenges about school, dieren, and sport."
```

The agent reads the spec, generates, and outputs JSON you can save to the challenges folder. This is ideal for iterating on quality or generating one-off challenges with specific requirements.

### Difficulty ↔ IEP mapping

| Difficulty | Referentieniveau | What it means |
|---|---|---|
| 🟢 low | toward 1F | Building blocks — factual recall only |
| 🔵 medium | at 1F | Fundamenteel niveau — comprehension + simple inference |
| 🟣 high | toward 1S/2F | Streefniveau — main idea, evaluation, writer's purpose |

## Image Generation

After generating text challenges:

```bash
# Generate images for all challenges that need them
node scripts/generate-challenge-images.js
```

The image script reads `imagePrompts` from each challenge JSON (if present) for better-targeted illustrations. Falls back to auto-generated prompts from the Dutch text.

## Workflow

1. **Generate text:** `node scripts/generate-challenge-text.js --groep ... --difficulty ...`
2. **Review:** Spot-check the JSON files for quality
3. **Generate images:** `node scripts/generate-challenge-images.js`
4. **Test:** `npm run dev` — new challenges appear automatically

## File Naming

Challenge files are named by their slug ID:
```
src/content/challenges/dutch-reading/de-rode-bal.json
```

The groep level and difficulty live inside the JSON — no prefix in the filename.
