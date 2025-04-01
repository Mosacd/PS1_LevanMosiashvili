import assert from "assert";
import { AnswerDifficulty, Flashcard, BucketMap } from "../src/flashcards";
import {
  toBucketSets,
  getBucketRange,
  practice,
  update,
  getHint,
  computeProgress,
} from "../src/algorithm";

/*
 * Testing strategy for toBucketSets():
 *
 * Partition on input Map:
 * - Empty map
 * - Single bucket
 * - Multiple contiguous buckets
 * - Multiple buckets with gaps
 * Partition on bucket contents:
 * - Empty bucket
 * - Single flashcard
 * - Multiple flashcards
 */
describe("toBucketSets()", () => {
  const card1 = new Flashcard("Q1", "A1", "", []);
  const card2 = new Flashcard("Q2", "A2", "", []);

  it("empty map returns empty array", () => {
    const buckets = new Map<number, Set<Flashcard>>();
    assert.deepStrictEqual(toBucketSets(buckets), []);
  });

  it("single bucket with one card", () => {
    const buckets = new Map([[0, new Set<Flashcard>([card1])]]);
    const result = toBucketSets(buckets);
    assert.strictEqual(result.length, 1);
    assert.deepStrictEqual(result[0], new Set([card1]));
  });

  it("multiple contiguous buckets", () => {
    const buckets = new Map([
      [0, new Set<Flashcard>([card1])],
      [1, new Set<Flashcard>([card2])],
    ]);
    const result = toBucketSets(buckets);
    assert.strictEqual(result.length, 2);
    assert.deepStrictEqual(result[0], new Set([card1]));
    assert.deepStrictEqual(result[1], new Set([card2]));
  });

  it("buckets with gaps filled with empty sets", () => {
    const buckets = new Map([[2, new Set<Flashcard>([card1])]]);
    const result = toBucketSets(buckets);
    assert.strictEqual(result.length, 3);
    assert.deepStrictEqual(result[0], new Set<Flashcard>());
    assert.deepStrictEqual(result[1], new Set<Flashcard>());
    assert.deepStrictEqual(result[2], new Set([card1]));
  });
});

/*
 * Testing strategy for getBucketRange():
 *
 * Partition on input buckets:
 * - Empty array
 * - All buckets empty
 * - Single non-empty bucket
 * - Multiple non-empty contiguous buckets
 * - Multiple non-empty buckets with gaps
 */
describe("getBucketRange()", () => {
  const card = new Flashcard("Q", "A", "", []);

  it("empty array returns undefined", () => {
    assert.strictEqual(getBucketRange([]), undefined);
  });

  it("all buckets empty returns undefined", () => {
    assert.strictEqual(getBucketRange([new Set<Flashcard>(), new Set<Flashcard>()]), undefined);
  });

  it("single non-empty bucket", () => {
    const buckets = [
      new Set<Flashcard>(),
      new Set<Flashcard>([card]),
      new Set<Flashcard>()
    ];
    assert.deepStrictEqual(getBucketRange(buckets), { minBucket: 1, maxBucket: 1 });
  });

  it("multiple non-empty contiguous buckets", () => {
    const buckets = [
      new Set<Flashcard>([card]),
      new Set<Flashcard>([card]),
      new Set<Flashcard>()
    ];
    assert.deepStrictEqual(getBucketRange(buckets), { minBucket: 0, maxBucket: 1 });
  });

  it("multiple non-empty buckets with gaps", () => {
    const buckets = [
      new Set<Flashcard>(),
      new Set<Flashcard>([card]),
      new Set<Flashcard>(),
      new Set<Flashcard>([card])
    ];
    assert.deepStrictEqual(getBucketRange(buckets), { minBucket: 1, maxBucket: 3 });
  });
});

/*
 * Testing strategy for practice():
 *
 * Partition on day number:
 * - Day 0
 * - Day 1
 * - Day that selects multiple buckets
 * Partition on bucket selection:
 * - Bucket 0 selected
 * - Higher buckets selected
 * - Multiple buckets selected
 */
describe("practice()", () => {
  const card0 = new Flashcard("Q0", "A0", "", []);
  const card1 = new Flashcard("Q1", "A1", "", []);
  const card2 = new Flashcard("Q2", "A2", "", []);

  it("day 0 selects bucket 0 only", () => {
    const buckets = [
      new Set<Flashcard>([card0]),
      new Set<Flashcard>([card1]),
      new Set<Flashcard>([card2]),
    ];
    const result = practice(buckets, 0);
    assert.deepStrictEqual(result, new Set([card0]));
  });

  it("day 1 selects bucket 1 only", () => {
    const buckets = [
      new Set<Flashcard>([card0]),
      new Set<Flashcard>([card1]),
      new Set<Flashcard>([card2]),
    ];
    const result = practice(buckets, 1);
    assert.deepStrictEqual(result, new Set([card1]));
  });

  it("day 3 selects buckets 0 and 2", () => {
    const buckets = [
      new Set<Flashcard>([card0]),
      new Set<Flashcard>(),
      new Set<Flashcard>([card2]),
    ];
    const result = practice(buckets, 3);
    assert.deepStrictEqual(result, new Set([card0, card2]));
  });

  it("empty buckets return empty set", () => {
    const buckets = [new Set<Flashcard>(), new Set<Flashcard>()];
    const result = practice(buckets, 0);
    assert.deepStrictEqual(result, new Set());
  });
});

/*
 * Testing strategy for update():
 *
 * Partition on difficulty:
 * - Easy answer
 * - Hard answer
 * - Wrong answer
 * Partition on current bucket:
 * - Bucket 0
 * - Higher bucket
 * Partition on edge cases:
 * - Card not found
 * - Bucket becomes empty after removal
 */
describe("update()", () => {
  const card = new Flashcard("Q", "A", "", []);

  it("easy answer moves to next bucket", () => {
    const buckets = new Map<number, Set<Flashcard>>([[0, new Set<Flashcard>([card])]]);
    const result = update(buckets, card, AnswerDifficulty.Easy);
    assert.strictEqual(result.get(1)?.has(card), true);
    assert.strictEqual(result.has(0), false);
  });

  it("hard answer moves to previous bucket", () => {
    const buckets = new Map<number, Set<Flashcard>>([[2, new Set<Flashcard>([card])]]);
    const result = update(buckets, card, AnswerDifficulty.Hard);
    assert.strictEqual(result.get(1)?.has(card), true);
    assert.strictEqual(result.has(2), false);
  });

  it("wrong answer resets to bucket 0", () => {
    const buckets = new Map<number, Set<Flashcard>>([[3, new Set<Flashcard>([card])]]);
    const result = update(buckets, card, AnswerDifficulty.Wrong);
    assert.strictEqual(result.get(0)?.has(card), true);
    assert.strictEqual(result.has(3), false);
  });

  it("hard answer from bucket 0 stays in bucket 0", () => {
    const buckets = new Map<number, Set<Flashcard>>([[0, new Set<Flashcard>([card])]]);
    const result = update(buckets, card, AnswerDifficulty.Hard);
    assert.strictEqual(result.get(0)?.has(card), true);
  });

  it("unknown card leaves buckets unchanged", () => {
    const buckets = new Map<number, Set<Flashcard>>([[0, new Set<Flashcard>()]]);
    const unknownCard = new Flashcard("X", "X", "", []);
    const result = update(buckets, unknownCard, AnswerDifficulty.Easy);
    assert.deepStrictEqual(result, buckets);
  });
});

/*
 * Testing strategy for getHint():
 *
 * Partition on front text:
 * - Empty string
 * - Single character
 * - Even length string
 * - Odd length string
 */
describe("getHint()", () => {
  it("empty front returns empty string", () => {
    const card = new Flashcard("", "A", "", []);
    assert.strictEqual(getHint(card), "");
  });

  it("single character shows full character", () => {
    const card = new Flashcard("A", "B", "", []);
    assert.strictEqual(getHint(card), "A");
  });

  it("even length shows first half", () => {
    const card = new Flashcard("ABCD", "EFGH", "", []);
    assert.strictEqual(getHint(card), "AB__");
  });

  it("odd length shows first half (rounded up)", () => {
    const card = new Flashcard("ABC", "DEF", "", []);
    assert.strictEqual(getHint(card), "AB_");
  });
});

/*
 * Testing strategy for computeProgress():
 *
 * Partition on buckets:
 * - Empty
 * - Single bucket
 * - Multiple buckets
 * Partition on history:
 * - Empty
 * - Some successes
 * - Some failures
 * - Mixed results
 */
describe("computeProgress()", () => {
  const card1 = new Flashcard("Q1", "A1", "", []);
  const card2 = new Flashcard("Q2", "A2", "", []);

  it("multiple buckets with mixed history", () => {
    const buckets = new Map<number, Set<Flashcard>>([
      [0, new Set<Flashcard>([card1])],
      [1, new Set<Flashcard>([card2])],
    ]);
    const history = [
      { card: card1, difficulty: AnswerDifficulty.Easy },
      { card: card1, difficulty: AnswerDifficulty.Wrong },
      { card: card2, difficulty: AnswerDifficulty.Hard },
      { card: card2, difficulty: AnswerDifficulty.Wrong },
    ];
    const result = computeProgress(buckets, history);
    assert.strictEqual(result.totalCards, 2);
    assert.strictEqual(result.cardsByBucket.get(0), 1);
    assert.strictEqual(result.cardsByBucket.get(1), 1);
    assert.strictEqual(result.successRate, 0.5);
    assert.strictEqual(result.hardestCards.length, 2);
    assert.deepStrictEqual(result.hardestCards, [card1, card2]);
  });
});