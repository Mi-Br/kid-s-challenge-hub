# Dutch Reading Challenge — Content Generation Agent

> **What is this?** The single source of truth for generating Dutch reading comprehension challenges for NT2 children (expats learning Dutch in the Netherlands). Any AI agent pointed at this file should be able to generate correct, schema-compliant, pedagogically calibrated content.

## 1. Project Context

This is a React/TypeScript app (`kid-s-challenge-hub`) serving Dutch reading exercises to expat children in the Netherlands. Children are categorized by their school **groep** (class year) and reading level.

**Key directories:**
```
src/content/challenges/dutch-reading/   ← challenge JSON files (auto-discovered)
public/images/challenges/dutch-reading/ ← generated images per challenge
scripts/                                ← THIS folder — generation tools
  AGENT.md                              ← you are here
  generate-challenge-text.js            ← batch generation script (Node.js)
  generate-challenge-images.js          ← image generation script (Gemini)
```

**Auto-discovery:** The app uses `import.meta.glob` to discover all `.json` files in the challenges folder. Drop a valid JSON file in → it appears in the app. No registration needed.

---

## 2. Schema

### Challenge JSON

```jsonc
{
  "id": "de-rode-bal",                          // slugified title, unique
  "title": "De Rode Bal",                       // Dutch title
  "groepLevel": "groep4-5",                     // "groep4-5" | "groep5-6" | "groep7-8"
  "difficulty": "low",                          // "low" | "medium" | "high"
  "referentieNiveau": "toward-1F",              // "toward-1F" | "1F" | "toward-1S/2F"
  "topic": "sport",                             // optional topic tag
  "text": "Paragraph one.\n\nParagraph two.",   // Dutch text, \n\n between paragraphs
  "questions": [ /* see below */ ],
  "images": [
    { "src": "/images/challenges/dutch-reading/de-rode-bal/image-1.png", "alt": "Dutch alt text" },
    { "src": "/images/challenges/dutch-reading/de-rode-bal/image-2.png", "alt": "Dutch alt text" }
  ],
  "imagePrompts": [                             // English prompts for image generation
    "A young boy kicking a red ball in a sunny Dutch park with windmills in the background",
    "The red ball rolling into a canal, the boy looking worried"
  ],
  "level": 2                                    // DEPRECATED — backward compat only
}
```

### Question Types

**Literal (factual recall — begrijpen):**
```json
{
  "question": "Welke kleur heeft de fiets?",
  "questionType": "begrijpen",
  "acceptableAnswers": ["rood", "rood met witte strepen"],
  "hint": "Kijk naar de tweede zin."
}
```

**Keywords (simple inference — interpreteren at groep4-5/5-6, simple evalueren):**
```json
{
  "question": "Waarom was Tom verdrietig?",
  "questionType": "interpreteren",
  "answerType": "explanation",
  "validation": {
    "mode": "keywords",
    "minWords": 3,
    "mustIncludeAny": [
      ["snel", "hard", "te snel"],
      ["fietsen", "fiets", "rijden", "reed", "fietste"]
    ],
    "allowExtraText": true
  },
  "hint": "Denk na over hoe Tom reed."
}
```

**AI-evaluated (complex comprehension — hoofdgedachte, evalueren, samenvatten, schrijversdoel, complex interpreteren):**
```json
{
  "question": "Wat is de hoofdgedachte van dit verhaal?",
  "questionType": "hoofdgedachte",
  "answerType": "explanation",
  "validation": {
    "mode": "ai",
    "rubric": "De leerling moet begrijpen dat het verhaal gaat over doorzetten als iets moeilijk is. De exacte woorden zijn niet belangrijk, maar de kern moet duidelijk zijn.",
    "exampleAnswer": "Het verhaal gaat erover dat je niet moet opgeven als iets moeilijk is.",
    "keyElements": ["doorzetten/volhouden/niet opgeven", "moeilijk/lastig/zwaar"],
    "minWords": 5
  },
  "hint": "Denk na: wat wil de schrijver je vertellen?"
}
```

### TypeScript Types (reference)

```typescript
// src/types/validation.ts
type ValidationMode = "literal" | "keywords" | "ai";

interface LiteralValidationConfig {
  mode: "literal";
  acceptableAnswers: string[];
}

interface KeywordValidationConfig {
  mode: "keywords";
  minWords: number;
  mustIncludeAny: string[][];
  allowExtraText: boolean;
}

interface AiValidationConfig {
  mode: "ai";
  rubric: string;           // What makes an answer correct (in Dutch)
  exampleAnswer: string;    // A good answer (not shown to student)
  keyElements: string[];    // Core concepts, also keyword fallback ("doorzetten/volhouden")
  minWords: number;         // Min words before calling AI
}

// src/types/challenges.ts
interface DutchQuestion {
  question: string;
  questionType?: "begrijpen" | "interpreteren" | "evalueren" | "hoofdgedachte" | "samenvatten" | "schrijversdoel" | "woordbetekenis";
  acceptableAnswers?: string[];
  hint?: string;
  answerType?: "literal" | "explanation";
  validation?: LiteralValidationConfig | KeywordValidationConfig | AiValidationConfig;
}

interface DutchChallenge {
  id: string;
  title: string;
  text: string;
  groepLevel: "groep4-5" | "groep5-6" | "groep7-8";
  difficulty: "low" | "medium" | "high";
  referentieNiveau: "toward-1F" | "1F" | "toward-1S/2F";
  topic?: string;
  images: { src: string; alt: string }[];
  questions: DutchQuestion[];
  imagePrompts?: string[];
  level?: number; // deprecated
}
```

---

## 3. Referentieniveau Calibration (IEP / Doorstroomtoets)

The Dutch education system uses **referentieniveaus** to benchmark reading comprehension. Our difficulty levels map directly to these:

| Difficulty | Referentieniveau | IEP Color | Who reaches this |
|---|---|---|---|
| `low` | **Toward 1F** | 🟢 | Building blocks — pre-1F readers |
| `medium` | **At 1F** | 🔵 | Fundamenteel Niveau — 85% of kids by end groep 8 |
| `high` | **Toward 1S/2F** | 🟣 | Streefniveau — ~50% of kids, target for havo/vwo |

### 🟢 Toward 1F — Building blocks

**Tekstkenmerken (text characteristics):**
- Very simple structure; information is predictably ordered
- Very low information density; important info is repeated
- Only high-frequency, everyday words (de/het, dier, huis, eten, spelen, school)
- Each paragraph = one clear idea, no ambiguity
- Short sentences, basic SVO word order
- No subordinate clauses, no passive voice

**Taakuitvoering (comprehension tasks):**
- Begrijpen only: recognize explicitly stated information
- Simple factual recall — answer is directly in the text, word for word

### 🔵 At 1F — Fundamenteel Niveau

**Tekstkenmerken:**
- Simple structure; information is recognizably ordered
- Low information density; important information is marked or repeated
- Predominantly high-frequency or everyday words
- New information is introduced one concept at a time
- Connectors mark relationships (maar, want, omdat, toen, daarna)
- Can use simple past tense, separable verbs, diminutives

**Taakuitvoering:**
- Begrijpen: understand the literal meaning of the text, recognize important information
- Interpreteren: interpret information and opinions that are close to the reader's world
- Evalueren: can express a simple opinion about a text part
- Reading strategies: can read globally or selectively based on purpose

### 🟣 Toward 1S/2F — Streefniveau

**Tekstkenmerken:**
- Clear structure with explicit connections between text parts (signaalwoorden)
- Moderate to high information density; text can be longer
- Can include less common words if meaning is inferable from context
- Multiple pieces of information can be combined
- Subordinate clauses (omdat hij ziek was), relative clauses (de jongen die...)
- All tenses including perfect (heeft gemaakt, is gegaan)
- Can include dialogue, figurative language, multiple perspectives

**Taakuitvoering:**
- Begrijpen: identify the main idea (hoofdgedachte), distinguish main from supporting points (hoofd- vs bijzaken)
- Interpreteren: identify relationships between text parts (inleiding, kern, slot); recognize figurative vs literal language (beeldspraak); can state the writer's purpose/intention
- Evalueren: evaluate relationships within and between texts; judge argumentation; assess text value
- Samenvatten: can concisely summarize a simple text
- Recognize signaalwoorden and use them for comprehension

---

## 4. Generation Specifications Per Groep

### GROEP 4-5 (ages 7-9)
Children beginning to read Dutch. Limited vocabulary (100-400 words).

| Aspect | 🟢 Low (toward 1F) | 🔵 Medium (at 1F) | 🟣 High (toward 1S/2F) |
|---|---|---|---|
| Words | 40-60 | 60-90 | 90-120 |
| Avg sentence | 4-6 words | 5-8 words | 7-10 words |
| Paragraphs | 2-3 | 3-4 | 3-5 |
| Tense | present only | present + was/had | + simple past (ging, zag) |
| Connectors | en | en, maar | + want, omdat (simple) |
| Questions | 3 all begrijpen | 3: 2 begrijpen + 1 interpreteren | 4: 2 begrijpen + 1 interpreteren + 1 woordbetekenis |
| Comprehension | Begrijpen only | Begrijpen + simple Interpreteren | + simple Evalueren ("Vind jij...?") |

### GROEP 5-6 (ages 8-10)
Can read basic Dutch texts, expanding vocabulary to 400-800 words.

| Aspect | 🟢 Low (toward 1F) | 🔵 Medium (at 1F) | 🟣 High (toward 1S/2F) |
|---|---|---|---|
| Words | 80-120 | 120-160 | 160-220 |
| Avg sentence | 6-10 words | 8-12 words | 10-15 words |
| Paragraphs | 3-4 | 4-5 | 4-6 |
| Tense | present + simple past | all simple tenses | + perfect tense |
| Grammar | basic connectors | separable verbs, diminutives, omdat-clauses | + subordinate clauses, relative clauses |
| Vocabulary | everyday | + feelings, time, weather | + 3-4 uncommon words explained by context |
| Questions | 3-4: 2 begrijpen + 1-2 interpreteren | 4: 1 begrijpen + 2 interpreteren + 1 evalueren | 5: 1 begrijpen + 2 interpreteren + 1 evalueren + 1 hoofdgedachte |
| Comprehension | Begrijpen + Interpreteren | + Evalueren | + Samenvatten elements, identify main idea |

### GROEP 7-8 (ages 10-12)
Fluent readers needing deeper comprehension. This is the IEP/doorstroomtoets group — **"high" should genuinely prepare for or exceed doorstroomtoets expectations.**

| Aspect | 🟢 Low (toward 1F) | 🔵 Medium (at 1F) | 🟣 High (toward 1S/2F) |
|---|---|---|---|
| Words | 160-220 | 220-300 | 300-400 |
| Avg sentence | 10-14 words | 12-18 words | 14-22 words |
| Paragraphs | 4-5 | 5-6 | 5-8 |
| Tense | all tenses | all tenses freely | all tenses + passive voice |
| Grammar | subordinate clauses | + relative clauses, indirect speech | complex sentence structures, multiple embeddings |
| Vocabulary | common + compound words | + abstract nouns, signaalwoorden | + figurative language, formal register, idiomatic expressions |
| Text features | narrative with clear arc | + multiple characters/perspectives | + implied meaning, unreliable narrator, text structure awareness |
| Questions | 4-5: 1 begrijpen + 3 interpreteren | 5: 1 begrijpen + 2 interpreteren + 1 evalueren + 1 hoofdgedachte | 5-6: 3 interpreteren + 1 evalueren + 1 hoofdgedachte + 1 schrijversdoel/samenvatten |
| Comprehension | Begrijpen + Interpreteren + Evalueren | + Samenvatten + signaalwoorden | Full 2F: evaluate argumentation, writer's purpose, judge text value, summarize |

---

## 5. Question Type Definitions

These map to the referentiekader's **kenmerken van de taakuitvoering**:

| Type | Domain | Validation | Description |
|---|---|---|---|
| `begrijpen` | Begrijpen | `literal` | Factual recall — answer is explicitly stated in text |
| `interpreteren` | Interpreteren | `keywords` | Infer meaning, character feelings, cause-effect |
| `evalueren` | Evalueren | `keywords` | Opinion + justification, judge text quality |
| `hoofdgedachte` | Interpreteren/Samenvatten | `keywords` | What is the text mainly about? |
| `samenvatten` | Samenvatten | `keywords` | Condense key points (higher minWords: 5-8) |
| `schrijversdoel` | Evalueren | `keywords` or `ai` | Why did the author write this? |
| `woordbetekenis` | Begrijpen/Interpreteren | `literal` | What does word X mean in this context? |

### Validation Mode Selection Guide

**Use `literal`** when there's one correct factual answer:
- begrijpen questions (always)
- woordbetekenis questions (always)
- Simple interpreteren where the answer is almost verbatim in the text

**Use `keywords`** when the answer requires some reasoning but is bounded:
- Simple interpreteren (cause-effect with clear vocabulary: "Waarom viel Tom?")
- Simple evalueren at groep4-5 / groep5-6 low/medium
- When you can reliably enumerate 3+ synonyms per concept

**Use `ai`** when the answer is genuinely open-ended:
- hoofdgedachte (main idea can be expressed infinitely many ways)
- samenvatten (summaries vary hugely in wording)
- schrijversdoel (writer's purpose is abstract)
- Complex evalueren (opinion + multi-part reasoning)
- Complex interpreteren at groep7-8 (deep inference, figurative language)

**Decision matrix by groep/difficulty:**

| Question Type | groep4-5 any | groep5-6 low/med | groep5-6 high | groep7-8 low | groep7-8 med | groep7-8 high |
|---|---|---|---|---|---|---|
| begrijpen | literal | literal | literal | literal | literal | literal |
| woordbetekenis | literal | literal | literal | literal | literal | literal |
| interpreteren | keywords | keywords | keywords/ai | keywords | keywords/ai | ai |
| evalueren | — | keywords | ai | keywords | ai | ai |
| hoofdgedachte | — | — | ai | — | ai | ai |
| samenvatten | — | — | — | — | — | ai |
| schrijversdoel | — | — | — | — | — | ai |

**AI validation config rules:**
1. `rubric` — 1-2 sentences in Dutch describing what a correct answer contains. Focus on concepts, not exact words.
2. `exampleAnswer` — one well-formed answer. The AI evaluator uses this as a reference but accepts different wordings.
3. `keyElements` — slash-separated synonyms (e.g., `"doorzetten/volhouden/niet opgeven"`). These serve double duty: guide the AI evaluator AND provide keyword fallback if the API is unavailable.
4. `minWords` — set higher for complex questions (5-8 for groep7-8 samenvatten) to avoid wasting API calls on empty answers.

**Scoring with AI validation:**
- `correct` = 25 points (student grasps the core concept)
- `partial` = 15 points (partially right, missing an important element)
- `incorrect` = 0 points (off-track or too vague)

---

## 6. Critical Rules

1. **All Dutch must be natural, grammatically correct, and idiomatic.** Not translated-sounding.
2. **Stories must engage expat children living in the Netherlands.** Reference Dutch life, customs, geography, school culture.
3. **🟣 HIGH difficulty must genuinely challenge.** Use the full 1S/2F taakuitvoering spec. Include questions about hoofdgedachte, schrijversdoel, beeldspraak where appropriate. Do NOT make it "medium with longer words."
4. **Every literal question answer MUST appear verbatim in the text.**
5. **Every keyword group MUST include 3+ synonyms** including common verb conjugations/inflections.
6. **Hints** point to the right paragraph without revealing the answer.
7. **acceptableAnswers** are always lowercase.
8. **id** = title slugified: "De Rode Bal" → `de-rode-bal`
9. **Questions and hints** must use language appropriate for the groep level.
10. **Cultural context** that helps expat children integrate (Dutch life, customs, geography).
11. **For woordbetekenis questions:** choose a word important for understanding the text whose meaning can be inferred from context.
12. **AI validation (`mode: "ai"`):** use for open-ended questions where keyword matching would frustrate correct answers. Include a clear rubric, example answer, and keyElements as fallback. See the validation mode selection guide above.
13. **Image prompts** are in English, describe a specific scene from the story, mention "children's book illustration style."
14. **Exactly 2 images** per challenge (image-1: main scene, image-2: key event).

---

## 7. File Naming Convention

```
src/content/challenges/dutch-reading/{id}.json
```

The `id` is the slugified title. Examples:
- `de-rode-bal.json`
- `het-geheim-van-de-molen.json`
- `een-dag-op-school.json`

**No groep/difficulty prefix in filename** — the JSON contains this metadata.

---

## 8. Workflow

### Interactive Generation (with an AI agent)

When an agent reads this file, it should:

1. **Ask for parameters:** groepLevel, difficulty, and optionally topic
2. **Generate** one or more challenges following the specs above
3. **Self-validate** against:
   - Word count within range for groep/difficulty
   - Sentence lengths appropriate
   - Grammar matches groep constraints
   - Question types match the required distribution
   - Literal answers appear verbatim in text
   - Keyword groups have 3+ synonyms
4. **Output** valid JSON that can be saved directly to the challenges folder

Example agent interaction:
```
Human: Generate 3 groep 5-6 medium challenges about school, dieren, and sport.
Agent: [reads AGENT.md] → generates 3 JSON files → validates → outputs
```

### Batch Generation (with the script)

```bash
# Generate specific challenges
node scripts/generate-challenge-text.js --groep groep5-6 --difficulty medium --topic school

# Generate a batch
node scripts/generate-challenge-text.js --groep groep7-8 --difficulty high --count 5

# Generate all missing combinations
node scripts/generate-challenge-text.js --fill-gaps
```

See `scripts/generate-challenge-text.js` for details.

### After Generation

1. **Review** the generated JSON files (spot-check text quality, question accuracy)
2. **Generate images** for new challenges:
   ```bash
   node scripts/generate-challenge-images.js
   ```
   The image script will pick up `imagePrompts` from the JSON if present.
3. **Test** in the app: `npm run dev`

---

## 9. Evaluation Criteria

When QA-checking generated content (manually or with an evaluation agent), verify:

### Text Quality
- [ ] Word count within spec range
- [ ] Sentence lengths within spec range (no sentences over max)
- [ ] Grammar matches groep/difficulty constraints (no future tense in groep4-5 low, etc.)
- [ ] No incomprehensible vocabulary for target group
- [ ] Natural Dutch — not translated-sounding
- [ ] Engaging story with a clear arc
- [ ] Cultural context accurate

### Question Quality
- [ ] Question types match the required distribution for this groep/difficulty
- [ ] Literal questions: answer appears verbatim in text
- [ ] Keyword questions: synonym groups have 3+ variants including verb forms
- [ ] Keyword questions: minWords appropriate for groep level
- [ ] Hints helpful but don't reveal the answer
- [ ] Question language appropriate for groep level
- [ ] For 🟣 high: genuinely tests 2F skills (hoofdgedachte, schrijversdoel, evalueren)

### Referentieniveau Alignment
- [ ] 🟢 low: only tests begrijpen (factual recall)
- [ ] 🔵 medium: tests begrijpen + interpreteren + simple evalueren
- [ ] 🟣 high: tests multiple 2F domains (interpreteren, evalueren, samenvatten, schrijversdoel)
- [ ] Text complexity matches the referentieniveau spec (info density, structure, vocabulary)

### Schema Compliance
- [ ] Valid JSON
- [ ] All required fields present
- [ ] id matches slugified title
- [ ] image paths follow convention
- [ ] Exactly 2 images / 2 imagePrompts
- [ ] acceptableAnswers all lowercase

---

## 10. Topic Bank

Suggested topics per groep (to avoid repetition across a set):

**groep4-5:** dieren, school, familie, eten, spelen, de buurt, het weer, kleding, verjaardagen, het lichaam

**groep5-6:** sport, Nederlandse feestdagen, vriendschap, natuur, beroepen, verkeer, seizoenen, de bibliotheek, huisdieren, de markt

**groep7-8:** milieu, wetenschap, Nederlandse geschiedenis, media, gezondheid, reizen, cultuur, technologie, democratie, wereldkeuken

---

## 11. Content Volume Target

| | Low | Medium | High | Total |
|---|---|---|---|---|
| groep4-5 | 10 | 10 | 8 | 28 |
| groep5-6 | 10 | 10 | 8 | 28 |
| groep7-8 | 8 | 8 | 6 | 22 |
| **Total** | 28 | 28 | 22 | **78 stories** |

Existing 13 challenges → map to groep5-6 low/medium (they're all short, simple texts at level 2).
