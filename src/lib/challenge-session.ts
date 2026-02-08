/**
 * Generic session utilities for challenge tracking
 * Used by all challenge pages for picking challenges and tracking completion
 */

/**
 * Get the IDs of completed challenges from localStorage
 */
export function getCompletedIds(storageKey: string): string[] {
  const stored = localStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : [];
}

/**
 * Mark a challenge as completed
 */
export function markCompleted(storageKey: string, id: string): void {
  const completed = getCompletedIds(storageKey);
  if (!completed.includes(id)) {
    completed.push(id);
    localStorage.setItem(storageKey, JSON.stringify(completed));
  }
}

/**
 * Pick N random challenges from available (not yet completed)
 * Uses Fisher-Yates shuffle for proper randomization
 * Resets completion if all challenges are done
 */
export function pickSessionChallenges<T extends { id: string }>(
  allChallenges: T[],
  storageKey: string,
  count = 3
): T[] {
  const completed = getCompletedIds(storageKey);
  let available = allChallenges.filter((c) => !completed.includes(c.id));

  // Reset if all challenges completed
  if (available.length < count) {
    localStorage.removeItem(storageKey);
    available = [...allChallenges];
  }

  // Fisher-Yates shuffle
  const shuffled = fisherYatesShuffle(available);
  return shuffled.slice(0, count);
}

/**
 * Fisher-Yates shuffle algorithm for proper randomization
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
