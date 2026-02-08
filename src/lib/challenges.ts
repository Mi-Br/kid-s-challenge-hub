import type { DutchChallenge } from '../types/challenges';

// Auto-discover all challenge JSON files
const challengeModules = import.meta.glob<{ default: DutchChallenge }>(
  '../content/challenges/*.json',
  { eager: true }
);

// Convert to array and sort by id for consistency
export const allChallenges: DutchChallenge[] = Object.values(challengeModules)
  .map(module => module.default)
  .sort((a, b) => a.id.localeCompare(b.id));

/**
 * Get challenges filtered by level
 */
export function getChallengesByLevel(level: number): DutchChallenge[] {
  return allChallenges.filter(c => c.level === level);
}

/**
 * Get a random challenge, optionally filtered by level
 */
export function getRandomChallenge(level?: number): DutchChallenge {
  const challenges = level ? getChallengesByLevel(level) : allChallenges;

  if (challenges.length === 0) {
    throw new Error(`No challenges available${level ? ` for level ${level}` : ''}`);
  }

  return challenges[Math.floor(Math.random() * challenges.length)];
}

/**
 * Get a challenge by ID
 */
export function getChallengeById(id: string): DutchChallenge | undefined {
  return allChallenges.find(c => c.id === id);
}

/**
 * Get all available levels
 */
export function getAvailableLevels(): number[] {
  const levels = allChallenges
    .map(c => c.level)
    .filter((level): level is number => level !== undefined);

  return Array.from(new Set(levels)).sort();
}
