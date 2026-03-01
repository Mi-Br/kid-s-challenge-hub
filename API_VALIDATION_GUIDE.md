# 🤖 AI Answer Validation Guide

## Overview

The challenge system supports **3 validation modes**:

| Mode | Use Case | API Required | Example |
|------|----------|--------------|---------|
| **Literal** | Factual answers (exact match) | ❌ No | "Welke kleur...?" |
| **Keywords** | Flexible comprehension (keyword groups) | ❌ No | "Waarom voelt Emma...?" |
| **AI** | Complex essays & arguments | ✅ Yes | "Wat is de hoofdgedachte...?" |

---

## Current Setup

### ✅ Already Configured
- **Validation system**: `src/lib/ai-evaluation.ts`
- **Consistent prompt template** (Dutch, rubric-based)
- **Three-tier scoring**: correct (25pts), partial (15pts), incorrect (0pts)
- **Graceful fallback**: Keywords matching if API unavailable

### 🎯 Challenge Status
- **groep4-5, groep5-6**: Use literal + keywords (no API needed)
- **groep7-8 high**: Ready for AI mode (optional API)

---

## Enable AI Validation (Optional)

### Step 1: Set API Key

**Option A: Environment Variable**
```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
```

**Option B: Runtime Configuration**
```javascript
// In your app initialization
import { setAiApiKey } from '@/lib/ai-evaluation';
setAiApiKey(process.env.ANTHROPIC_API_KEY);
```

### Step 2: Use AI Mode in Challenges

For **complex questions** (groep7-8 high), use `mode: "ai"`:

```json
{
  "question": "Wat is de hoofdgedachte van dit verhaal?",
  "questionType": "hoofdgedachte",
  "answerType": "explanation",
  "validation": {
    "mode": "ai",
    "rubric": "De leerling moet begrijpen dat het verhaal gaat over vriendschap en vertrouwen.",
    "exampleAnswer": "Het gaat over twee kinderen die elkaar leren vertrouwen.",
    "keyElements": ["vriendschap", "vertrouwen", "vrienden"],
    "minWords": 5
  }
}
```

---

## How AI Validation Works

### Prompt Template

```dutch
Beoordeel het antwoord van een leerling op een Nederlands begrijpend-lezen vraag.

De leerling zit in groep7-8 (NT2 — Nederlands als tweede taal).

Vraag: [QUESTION]
Goed antwoord (voorbeeld): [EXAMPLE]
Beoordelingscriteria: [RUBRIC]
Kernelementen: [KEY_ELEMENTS]

Antwoord leerling: "[STUDENT_ANSWER]"

Beoordeel als JSON: {"judgement":"correct"|"partial"|"incorrect","feedback":"<1 zin in eenvoudig Nederlands, bemoedigend>"}

correct = de kern is begrepen (woorden hoeven niet exact te zijn)
partial = deels goed maar mist een belangrijk element
incorrect = niet juist of te vaag

Alleen JSON, geen uitleg.
```

### Example Evaluation

```
Question: "Waarom help Tom Lisa?"
Student: "Tom help Lisa omdat ze vrienden zijn en hij van haar houdt"

AI Response:
{
  "judgement": "correct",
  "feedback": "Goed! Je ziet dat vriendschap het belangrijkste is."
}
```

---

## Scoring System

| Judgement | Points | Meaning |
|-----------|--------|---------|
| **correct** | 25 | Core concept understood |
| **partial** | 15 | Partially correct, missing elements |
| **incorrect** | 0 | Wrong or too vague |

---

## Cost & Performance

### Costs
- **API**: Claude Haiku @ $0.80/1M tokens
- **Per evaluation**: ~300 tokens input, ~60 output = ~$0.0003/eval
- **100 evaluations**: ~$0.03

### Performance
- **Speed**: <1 second per response
- **Fallback**: Auto-switches to keyword matching if API unavailable

---

## Feedback to Students

### AI Mode Feedback

✅ **Correct**
```
"Goed gedaan! Je begrijpt dat vriendschap belangrijk is."
```

⚠️ **Partial**
```
"Je bent op de goede weg! Vergeet niet waarom hij dat deed."
```

❌ **Incorrect**
```
"Probeer nog eens. Lees het stuk waar Tom praat."
```

### If API Unavailable
Falls back to **keyword matching** on `keyElements`:
- 70%+ elements matched = correct (25pts)
- 40-70% = partial (15pts)
- <40% = incorrect (0pts)

---

## Configuration Files

### Validation Types
```typescript
// src/types/validation.ts
interface AiValidationConfig {
  mode: "ai";
  rubric: string;           // What makes answer correct (Dutch)
  exampleAnswer: string;    // Good answer example
  keyElements: string[];    // Core concepts (e.g., "vriendschap/vrienden")
  minWords: number;         // Minimum word count to evaluate
}
```

### Challenge Structure
```typescript
// src/types/challenges.ts
interface DutchQuestion {
  question: string;
  questionType: "begrijpen" | "interpreteren" | "evalueren" | "hoofdgedachte" | "samenvatten";
  answerType?: "literal" | "explanation";
  validation?: ValidationConfig;  // Can be literal, keywords, or ai
  hint?: string;
}
```

---

## Best Practices

### ✅ DO
- Use AI for **open-ended questions** only (groep7-8)
- Provide **clear rubrics** (1-2 sentences)
- Include **example answers** (shows expected depth)
- Use **keyElements** as fallback (auto-activate if API fails)
- Set **minWords** to avoid wasting API calls on empty responses

### ❌ DON'T
- Use AI for factual questions (use literal)
- Use AI for simple comprehension (use keywords)
- Rely only on API (always have keyElements fallback)
- Create overly complex rubrics (keep it simple for L2 learners)

---

## Testing

### Without API
Everything works! Keywords fallback handles validation.

### With API
```bash
# Set key
export ANTHROPIC_API_KEY=sk-ant-...

# Run tests
npm test
```

---

## Local Deployment

### For Kids (No API Needed)
```bash
npm run preview
# Full functionality with keywords validation
# AI mode falls back to keyword matching
```

### For Teachers (With API)
```bash
# 1. Add API key to .env.local
ANTHROPIC_API_KEY=sk-ant-...

# 2. Run server
npm run dev

# 3. Complex questions now use AI validation
# Feedback is more intelligent and nuanced
```

---

## Summary

**Current Status:**
- ✅ Literal validation: Ready (no API)
- ✅ Keywords validation: Ready (no API)
- ✅ AI validation: Ready (optional API)
- ✅ Fallback system: Built-in (keywords if API fails)

**For your kids:**
- 🚀 Works immediately with no API key
- 🤖 Enhanced validation available if you add API key
- 📚 Same 478 challenges, just smarter feedback

**Consistent prompt system** ensures:
- Rubric-based evaluation (not arbitrary)
- Age-appropriate Dutch feedback
- Flexible matching (grammar errors OK)
- 3-tier scoring for partial credit
