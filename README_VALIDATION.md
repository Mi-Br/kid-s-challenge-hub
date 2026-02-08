# Keyword-Based Validation System

This document explains the new validation system for Dutch reading challenges. It supports both **literal validation** (exact answers) and **keywords validation** (explanation questions with flexible matching).

## Quick Start

### For Existing Challenges
No changes needed! All existing challenges continue to work exactly as before.

```json
{
  "question": "Hoe heet de kat?",
  "acceptableAnswers": ["milo"]
}
```

### For New Explanation Questions
Add an explanation question with keyword validation:

```json
{
  "question": "Waarom viel Tom?",
  "answerType": "explanation",
  "validation": {
    "mode": "keywords",
    "minWords": 3,
    "mustIncludeAny": [
      ["snel", "hard", "te snel"],
      ["fietsen", "fiets", "rijden", "reed"]
    ],
    "allowExtraText": true
  }
}
```

## System Overview

### Two Validation Modes

#### 1. Literal Mode (Exact Matching)
Used for factual questions where the exact answer matters.

- **Input:** "What color is the cat?"
- **Config:** `acceptableAnswers: ["black", "black and white"]`
- **Accepted:** "black", "BLACK", "black.", "black "
- **Rejected:** "white", "dark"
- **Feedback:** Shows the exact accepted answers

#### 2. Keywords Mode (Flexible Matching)
Used for explanation questions where demonstrating understanding matters more than exact wording.

- **Input:** "Why did the character run?"
- **Config:** `mode: "keywords", minWords: 3, mustIncludeAny: [["fast", "quick"], ["run", "sprint"]]`
- **Accepted:** "they ran fast", "quickly running away", "character sprinted"
- **Rejected:** "they ran" (2 words, < 3 minimum), "character moved" (missing keywords)
- **Feedback:** Shows hints about missing concepts

## Validation Architecture

```
Question
  ↓
validateAnswer(answer, question)
  ↓
  ├─ If question.validation exists:
  │  ├─ mode: "literal" → validateLiteral()
  │  └─ mode: "keywords" → validateKeywords()
  │
  └─ Else if question.acceptableAnswers exists:
     └─ validateLiteral() [legacy support]
  ↓
ValidationResult
  ├─ isCorrect: boolean
  └─ feedback?: {
       mode: "literal" | "keywords"
       matchedKeywords?: string[]
       missingKeywordGroups?: string[][]
       wordCount?: number
       acceptableAnswers?: string[]
     }
```

## Features

### Text Normalization
All answers are normalized before validation:
- Lowercase: "Hello" → "hello"
- Punctuation removed: "hello!" → "hello"
- Extra spaces removed: "hello  world" → "hello world"
- Trimmed: "  hello  " → "hello"

### Synonym Groups
Concept matching with alternatives:

```
[["snel", "hard", "te snel"], ["fietsen", "fiets", "rijden"]]
```

This means:
- Must mention speed (any synonym: snel, hard, te snel)
- AND must mention cycling (any synonym: fietsen, fiets, rijden)

Example accepted answers:
- "hij reed te snel" ✓ (contains "reed" which has "ried" matching "rijden", and "snel")
- "hij fiets hard" ✓
- "zij ging snel met fiets" ✓

Example rejected answers:
- "hij snel" ✗ (missing cycling concept)
- "hij fiets" ✗ (missing speed concept)
- "hij speelde" ✗ (no keywords matched)

### L2-Learner Friendly
Designed to accept variations from second-language learners:

- Grammar errors: "tom fiets snel" (subject-verb agreement) → accepted
- Inflected forms: "gefietst" → matches "fiets"
- Different word order: "fiets snel hij" → accepted (has keywords)
- Extra explanation: "hij reed hard omdat..." → accepted

### Minimum Word Count
Prevents answers that are too short:

```json
{ "minWords": 3 }
```

This requires at least 3 words. Examples:
- "hij viel" (2 words) ✗
- "hij viel hard" (3 words) ✓

## Configuration Options

### Literal Mode Config
```typescript
{
  mode: "literal"
  acceptableAnswers: string[]  // Case-insensitive exact matches
}
```

### Keywords Mode Config
```typescript
{
  mode: "keywords"
  minWords: number             // Minimum words required
  mustIncludeAny: string[][]   // 2D array of synonym groups
  allowExtraText: boolean      // Usually true, allows longer answers
  disallowedKeywords?: string[] // Optional: reject if present
}
```

## Usage Examples

### Example 1: Simple Factual Question
```json
{
  "question": "Welke kleur heeft de kat?",
  "acceptableAnswers": ["zwart", "zwart en wit"],
  "hint": "Kijk naar de tweede zin"
}
```

### Example 2: Simple Explanation
```json
{
  "question": "Waarom ging Tom naar de winkel?",
  "answerType": "explanation",
  "validation": {
    "mode": "keywords",
    "minWords": 3,
    "mustIncludeAny": [
      ["boodschappen", "dingen", "eten", "spullen"],
      ["winkel", "shop"]
    ],
    "allowExtraText": true
  }
}
```

Accepted answers:
- "hij ging boodschappen in de winkel"
- "tom nodig eten van winkel"
- "spullen kopen in winkel"

### Example 3: Complex Explanation with Multiple Concepts
```json
{
  "question": "Waarom viel de fiets?",
  "answerType": "explanation",
  "validation": {
    "mode": "keywords",
    "minWords": 4,
    "mustIncludeAny": [
      ["snel", "hard", "te snel", "veel te snel"],
      ["fietsen", "fiets", "rijden", "reed"],
      ["viel", "omviel", "naar beneden"]
    ],
    "allowExtraText": true
  }
}
```

Requires mentions of speed AND cycling AND falling.

## UI/UX

### Input Placeholder
- Literal questions: "Type your answer..."
- Explanation questions: "Explain in Dutch..."

### Feedback on Wrong Answer
- Literal mode: "Accepted answers: ..."
- Keywords mode (too short): "Your answer is too short. Try to explain more!"
- Keywords mode (missing keywords): "Hint: Try to mention these ideas in your answer: ..."

## Testing

For comprehensive testing, see `VALIDATION_TESTS.md`.

Quick test checklist:
1. Load existing challenge → answer should work as before
2. Load "de-fiets-waarom" challenge
3. Q2 "Waarom viel Tom?"
   - Answer "hij reed te snel" → should ACCEPT
   - Answer "hij viel" → should REJECT (too short)
   - Answer "hij speelde" → should REJECT (no keywords)

## Code Structure

### Key Files
- `src/types/validation.ts` - Type definitions
- `src/lib/answer-validation.ts` - Validation logic
- `src/types/challenges.ts` - Extended challenge types
- `src/pages/LearnDutch.tsx` - Component integration

### Main Functions
```typescript
// Text normalization - makes answers comparable
normalizeText(text: string): string

// Exact string matching for factual questions
validateLiteral(answer: string, config): ValidationResult

// Flexible matching for explanation questions
validateKeywords(answer: string, config): ValidationResult

// Main function - routes to appropriate validator
validateAnswer(answer: string, question: DutchQuestion): ValidationResult
```

## Backward Compatibility

✅ **100% backward compatible**

- All existing challenges work unchanged
- No migration needed
- Legacy `acceptableAnswers` field still supported
- New optional fields are truly optional

## Best Practices

### When to Use Literal Mode
- Facts: "What is the capital of France?"
- Names: "What is the cat's name?"
- Specific terms: "What color is the book?"

### When to Use Keywords Mode
- Why questions: "Why did the character...?"
- Explanations: "Describe what happened when..."
- Open-ended: "What do you think about...?"

### Designing Keyword Groups
- Use 2-3 groups maximum (more is confusing)
- Make groups orthogonal (non-overlapping concepts)
- Use 2-4 synonyms per group
- Consider word forms (fiets, fietsen, gefietst)

### Example: Good vs Bad Groups

✅ Good (orthogonal concepts):
```
[
  ["snel", "hard", "te snel"],           // Speed concept
  ["fietsen", "fiets", "rijden", "reed"], // Cycling concept
  ["viel", "omviel"]                     // Falling concept
]
```

❌ Bad (overlapping):
```
[
  ["snel", "hard"],           // Speed
  ["snel fietsen", "hard riding"],  // These overlap with speed group
  ["fiets", "bike"]
]
```

## Troubleshooting

### Question not validating
- Check question has either `acceptableAnswers` OR `validation` field
- If using `validation`, ensure `mode` is correct

### Answer always rejected
- Check `minWords` - maybe answer is too short
- Check keyword groups - do keywords actually appear in answer?
- Use exact keywords from groups (with normalization)

### Wrong feedback showing
- Literal mode shows "Accepted answers: ..."
- Keywords mode shows word count or keyword hints
- Make sure `validationResult` is set after answer submission

### Keyword not matching
- Remember: substring matching, so "fiets" matches "fietsen"
- Check normalization: punctuation removed, lowercase
- Verify 2D array structure is correct

## Future Enhancements

Possible extensions:
- `requireAllGroups: boolean` - Stricter matching (all or nothing)
- `partialCreditThreshold: number` - Award partial points
- `enableStemming: boolean` - Dutch-specific stemming
- `contextualKeywords: boolean` - Match in context
- Analytics on explanation quality

## Questions?

For detailed technical documentation, see `IMPLEMENTATION_SUMMARY.md`.
For comprehensive test cases, see `VALIDATION_TESTS.md`.
For quick reference, see `QUICK_REFERENCE.md`.
