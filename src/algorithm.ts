/**
 * Problem Set 1: Flashcards - Algorithm Functions
 *
 * This file contains the implementations for the flashcard algorithm functions
 * as described in the problem set handout.
 *
 * Please DO NOT modify the signatures of the exported functions in this file,
 * or you risk failing the autograder.
 */

import { Flashcard, AnswerDifficulty, BucketMap } from "./flashcards";

/**
 * Converts a Map representation of learning buckets into an Array-of-Set representation.
 *
 * @param buckets Map where keys are bucket numbers and values are sets of Flashcards.
 * @returns Array of Sets, where element at index i is the set of flashcards in bucket i.
 *          Buckets with no cards will have empty sets in the array.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function toBucketSets(buckets: BucketMap): Array<Set<Flashcard>> {
  // TODO: Implement this function
  let array : Set<Flashcard>[] = [];

  let lastbucket = 0;

  for(const number of buckets.keys()){
    if(number >= lastbucket){
     lastbucket = number
    }
  }

  for(let i = 0; i <= lastbucket; i++){
    array[i] = new Set<Flashcard>();
  }

  for(const bucket of buckets){
    array[bucket[0]] = bucket[1];
  }

  // for(const [bucketIndex,value] of buckets.entries()){
  //   array[bucketIndex] = value;
  // }

  return array;
}

/**
 * Finds the range of buckets that contain flashcards, as a rough measure of progress.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @returns object with minBucket and maxBucket properties representing the range,
 *          or undefined if no buckets contain cards.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function getBucketRange(
  buckets: Array<Set<Flashcard>>
): { minBucket: number; maxBucket: number } | undefined {
  let minBucket: number | undefined;
  let maxBucket: number | undefined;

  for (let i = 0; i < buckets.length; i++) {
    if ((buckets[i] ?? new Set<Flashcard>()).size > 0) {
      if (minBucket === undefined || i < minBucket) {
        minBucket = i;
      }
      if (maxBucket === undefined || i > maxBucket) {
        maxBucket = i;
      }
    }
  }

  return minBucket !== undefined && maxBucket !== undefined 
    ? { minBucket, maxBucket } 
    : undefined;
}

/**
 * Selects cards to practice on a particular day.
 *
 * @param buckets Array-of-Set representation of buckets.
 * @param day current day number (starting from 0).
 * @returns a Set of Flashcards that should be practiced on day `day`,
 *          according to the Modified-Leitner algorithm.
 * @spec.requires buckets is a valid Array-of-Set representation of flashcard buckets.
 */
export function practice(
  buckets: Array<Set<Flashcard>>,
  day: number
): Set<Flashcard> {
  const practiceCards = new Set<Flashcard>();
  const dayNumber = day + 1; // Convert to 1-based index

  for (let bucketIndex = 0; bucketIndex < buckets.length; bucketIndex++) {
    if (buckets[bucketIndex] && dayNumber % Math.pow(2, bucketIndex) === 0) {
      (buckets[bucketIndex] ?? new Set<Flashcard>()).forEach(card => practiceCards.add(card));
    }
  }

  return practiceCards;
}

/**
 * Updates a card's bucket number after a practice trial.
 *
 * @param buckets Map representation of learning buckets.
 * @param card flashcard that was practiced.
 * @param difficulty how well the user did on the card in this practice trial.
 * @returns updated Map of learning buckets.
 * @spec.requires buckets is a valid representation of flashcard buckets.
 */
export function update(
  buckets: BucketMap,
  card: Flashcard,
  difficulty: AnswerDifficulty
): BucketMap {
  // Create a new Map to maintain immutability
  const newBuckets = new Map(buckets);
  let currentBucket: number | undefined;

  // Find which bucket the card is currently in
  for (const [bucketNum, cards] of newBuckets.entries()) {
    if (cards.has(card)) {
      currentBucket = bucketNum;
      break;
    }
  }

  // If card wasn't found, return unchanged
  if (currentBucket === undefined) {
    return newBuckets;
  }

  // Remove card from current bucket
  const currentCards = newBuckets.get(currentBucket)!;
  currentCards.delete(card);
  if (currentCards.size === 0) {
    newBuckets.delete(currentBucket);
  }

  // Determine new bucket based on difficulty
  let newBucket: number;
  switch (difficulty) {
    case AnswerDifficulty.Easy:
      newBucket = currentBucket + 1;
      break;
    case AnswerDifficulty.Hard:
      newBucket = Math.max(0, currentBucket - 1);
      break;
    case AnswerDifficulty.Wrong:
      newBucket = 0;
      break;
    default:
      newBucket = currentBucket;
  }

  // Add card to new bucket
  const newCards = newBuckets.get(newBucket) || new Set<Flashcard>();
  newCards.add(card);
  newBuckets.set(newBucket, newCards);

  return newBuckets;
}

/**
 * Generates a hint for a flashcard.
 *
 * @param card flashcard to hint
 * @returns a hint for the front of the flashcard.
 * @spec.requires card is a valid Flashcard.
 */
export function getHint(card: Flashcard): string {
  if (!card.front || card.front.length === 0) {
    return "";
  }

  // Show first half (rounded up) of the front text
  const hintLength = Math.ceil(card.front.length / 2);
  const shown = card.front.substring(0, hintLength);
  const hidden = "_".repeat(card.front.length - hintLength);

  return shown + hidden;
}

/**
 * Computes statistics about the user's learning progress.
 *
 * @param buckets representation of learning buckets.
 * @param history representation of user's answer history.
 * @returns statistics about learning progress.
 * @spec.requires [SPEC TO BE DEFINED]
 */
export function computeProgress(buckets: any, history: any): any {
  // Count total cards and cards per bucket
  let totalCards = 0;
  const cardsByBucket = new Map<number, number>();
  for (const [bucket, cards] of buckets.entries()) {
    const count = cards.size;
    totalCards += count;
    cardsByBucket.set(bucket, count);
  }

  // Calculate success rate (Easy/Hard count as success)
  let successCount = 0;
  for (const entry of history) {
    if (entry.difficulty === AnswerDifficulty.Easy || 
        entry.difficulty === AnswerDifficulty.Hard) {
      successCount++;
    }
  }
  const successRate = history.length > 0 ? successCount / history.length : 0;

  // Find hardest cards (most frequently answered Wrong)
  const wrongCounts = new Map<Flashcard, number>();
  for (const entry of history) {
    if (entry.difficulty === AnswerDifficulty.Wrong) {
      const count = wrongCounts.get(entry.card) || 0;
      wrongCounts.set(entry.card, count + 1);
    }
  }

  const hardestCards = Array.from(wrongCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3) // Top 3 hardest cards
    .map(([card]) => card);

  return {
    totalCards,
    cardsByBucket,
    successRate,
    hardestCards,
  };
}
