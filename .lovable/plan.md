## Goal
Make the Vocabulary page a real dictionary workspace: link entries back to the stories they came from, allow deletion, allow manual "add a word/sentence" translation, and add a persistent side panel inside the Learn Dutch reader for on-demand translation.

## 1. Track story titles (not just IDs)

Right now `vocabulary_lookups.story_id` stores the story id but we have no easy title lookup on the vocab page.

- Add a small helper `getStoryMeta(storyId)` in `src/lib/challenges.ts` that returns `{ id, title, groep }` for any known challenge id.
- When the reader translates a word, keep passing `storyId` (already done). No schema change needed.
- On the Vocabulary page, resolve each lookup's `story_id` → title and render a clickable chip that navigates to `/learn-dutch?story=<id>`.
- Extend `LearnDutch.tsx` to read `?story=` on mount and jump straight into that story's reading view.

## 2. Deletion

- Add a trash button on each vocabulary card.
- New helper `deleteLookup(lookupId)` in `src/lib/vocabulary.ts` that deletes from `vocabulary_lookups` (per profile) and evicts the local/memory cache entry for that Dutch text.
- Add a "Clear all" button in the Vocabulary header with an AlertDialog confirm — deletes all lookups for the current profile. Shared `vocabulary_entries` rows stay (they're the collective dictionary).

## 3. Manual "Add a word or sentence"

- Add an "➕ Nieuw woord" button on the Vocabulary page that opens a Dialog with:
  - Text input
  - Word / Sentence toggle
  - "Vertaal & bewaar" button → calls the existing `translateAndSave({ text, type })` (no storyId).
- On success, prepend to the list and toast confirmation. Reuses the cache + shared dictionary logic already in place.

## 4. Translation side panel in the reader

- New component `src/components/TranslateSidePanel.tsx`: a collapsible right-side panel (Sheet on mobile, sticky sidebar on desktop) inside `LearnDutch.tsx`'s story view.
- Contents: input, Woord/Zin toggle, "Vertaal" button, and the last translated result rendered with the same layout as the popover (speak button, POS, explanation, example).
- On submit → `translateAndSave({ text, type, storyId: currentStory.id })` so it's tagged to the story the kid is reading.
- Toast: "Toegevoegd aan woordenschat".

## 5. Small polish

- Show story chip on each vocab card only when `story_id` resolves to a known story; otherwise show "Handmatig toegevoegd" for manual entries.
- Sort/filter bar unchanged.

## Technical notes

Files to touch:
- `src/lib/vocabulary.ts` — add `deleteLookup`, `deleteAllLookupsForProfile`, export a small `evictLocal(text, type)` helper.
- `src/lib/challenges.ts` — add `getStoryMeta(id)`.
- `src/pages/Vocabulary.tsx` — story chips, delete buttons, Clear-all dialog, Add-word dialog.
- `src/pages/LearnDutch.tsx` — accept `?story=` query param, mount `TranslateSidePanel` in story view.
- `src/components/TranslateSidePanel.tsx` — new.

No DB migration needed — existing `vocabulary_lookups.story_id` and RLS policies (delete allowed) already cover this.
