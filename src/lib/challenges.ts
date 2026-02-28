import type { DutchChallenge, GroepLevel, Difficulty } from '../types/challenges';

// Auto-discover all challenge JSON files
const challengeModules = import.meta.glob<{ default: DutchChallenge }>(
  '../content/challenges/dutch-reading/*.json',
  { eager: true }
);

// Convert to array and sort by id for consistency
export const allChallenges: DutchChallenge[] = Object.values(challengeModules)
  .map(module => module.default)
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Get challenges filtered by groep level and optionally difficulty
 */
export function getChallengesByGroep(
  groepLevel: GroepLevel,
  difficulty?: Difficulty
): DutchChallenge[] {
  return allChallenges.filter(c => {
    if (c.groepLevel !== groepLevel) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    return true;
  });
}

/**
 * Get all available groep levels that have content
 */
export function getAvailableGroepLevels(): GroepLevel[] {
  const levels = new Set<GroepLevel>();
  allChallenges.forEach(c => {
    if (c.groepLevel) levels.add(c.groepLevel);
  });
  return Array.from(levels).sort();
}

/**
 * Get available difficulties for a given groep level
 */
export function getAvailableDifficulties(groepLevel: GroepLevel): Difficulty[] {
  const diffs = new Set<Difficulty>();
  allChallenges
    .filter(c => c.groepLevel === groepLevel)
    .forEach(c => { if (c.difficulty) diffs.add(c.difficulty); });
  return ["low", "medium", "high"].filter(d => diffs.has(d as Difficulty)) as Difficulty[];
}

/**
 * Get challenge count for a given groep/difficulty
 */
export function getChallengeCount(groepLevel?: GroepLevel, difficulty?: Difficulty): number {
  return allChallenges.filter(c => {
    if (groepLevel && c.groepLevel !== groepLevel) return false;
    if (difficulty && c.difficulty !== difficulty) return false;
    return true;
  }).length;
}

// Legacy support
export function getChallengesByLevel(level: number): DutchChallenge[] {
  return allChallenges.filter(c => c.level === level);
}

export function getChallengeById(id: string): DutchChallenge | undefined {
  return allChallenges.find(c => c.id === id);
}
