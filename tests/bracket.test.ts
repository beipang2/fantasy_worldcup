import { describe, it, expect } from "vitest";
import { buildBracket, advance } from "@/lib/bracket";
import type { Photo } from "@/lib/bracket";

function makePhotos(n: number): Photo[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    url: `https://example.com/p${i}.jpg`,
    label: `Player ${i}`,
  }));
}

/** Play through an entire bracket, always picking queue[0].a, and return the final state. */
function playAll(photos: Photo[]) {
  let b = buildBracket(photos);
  while (!b.champion) {
    b = advance(b, b.queue[0].a);
  }
  return b;
}

describe("buildBracket", () => {
  it("caps bracket at 16 regardless of photo count", () => {
    const b = buildBracket(makePhotos(38));
    expect(b.queue).toHaveLength(8); // 16 players → 8 first-round matches
    expect(b.totalRounds).toBe(4);
  });

  it("uses nearest power-of-2 ≤ n for smaller pools", () => {
    expect(buildBracket(makePhotos(4)).queue).toHaveLength(2);
    expect(buildBracket(makePhotos(5)).queue).toHaveLength(2);  // floor2(5)=4
    expect(buildBracket(makePhotos(8)).queue).toHaveLength(4);
    expect(buildBracket(makePhotos(9)).queue).toHaveLength(4);  // floor2(9)=8
  });

  it("initialises counters to zero / empty", () => {
    const b = buildBracket(makePhotos(8));
    expect(b.matchesPlayed).toBe(0);
    expect(b.advancedPhotos).toHaveLength(0);
    expect(b.winners).toHaveLength(0);
    expect(b.champion).toBeNull();
    expect(b.round).toBe(1);
  });

  it("totalRounds matches log2 of bracket size", () => {
    expect(buildBracket(makePhotos(4)).totalRounds).toBe(2);
    expect(buildBracket(makePhotos(8)).totalRounds).toBe(3);
    expect(buildBracket(makePhotos(16)).totalRounds).toBe(4);
  });
});

describe("advance – within a round", () => {
  it("increments matchesPlayed by 1 each vote", () => {
    let b = buildBracket(makePhotos(4));
    expect(b.matchesPlayed).toBe(0);
    b = advance(b, b.queue[0].a);
    expect(b.matchesPlayed).toBe(1);
    b = advance(b, b.queue[0].a);
    expect(b.matchesPlayed).toBe(2);
  });

  it("adds winner to advancedPhotos, newest first", () => {
    let b = buildBracket(makePhotos(4));
    const first = b.queue[0].a;
    b = advance(b, first);
    expect(b.advancedPhotos[0]).toEqual(first);
  });

  it("shrinks the queue by 1 per vote", () => {
    let b = buildBracket(makePhotos(8)); // 4 first-round matches
    expect(b.queue).toHaveLength(4);
    b = advance(b, b.queue[0].a);
    expect(b.queue).toHaveLength(3);
    b = advance(b, b.queue[0].a);
    expect(b.queue).toHaveLength(2);
  });
});

describe("advance – round transitions", () => {
  it("clears advancedPhotos when a new round starts", () => {
    // 4-player: 2 matches in round 1 end the round
    let b = buildBracket(makePhotos(4));
    b = advance(b, b.queue[0].a); // match 1 of 2
    expect(b.advancedPhotos).toHaveLength(1);
    b = advance(b, b.queue[0].a); // match 2 of 2 → round ends
    expect(b.advancedPhotos).toHaveLength(0);
    expect(b.round).toBe(2);
  });

  it("increments round number at round boundary", () => {
    let b = buildBracket(makePhotos(8)); // 3 rounds
    expect(b.round).toBe(1);
    // play all 4 first-round matches
    for (let i = 0; i < 4; i++) b = advance(b, b.queue[0].a);
    expect(b.round).toBe(2);
    // play all 2 semi-final matches
    for (let i = 0; i < 2; i++) b = advance(b, b.queue[0].a);
    expect(b.round).toBe(3);
  });

  it("matchesPlayed never resets across rounds", () => {
    const final = playAll(makePhotos(4));
    expect(final.matchesPlayed).toBe(3); // 4 players = 3 total matches
  });
});

describe("advance – champion", () => {
  it("sets champion after the final match", () => {
    const final = playAll(makePhotos(4));
    expect(final.champion).not.toBeNull();
    expect(final.queue).toHaveLength(0);
  });

  it("champion is one of the original photos", () => {
    const photos = makePhotos(4);
    const ids = new Set(photos.map((p) => p.id));
    const { champion } = playAll(photos);
    expect(ids.has(champion!.id)).toBe(true);
  });

  it("full 16-player run ends in exactly 15 matches", () => {
    const final = playAll(makePhotos(16));
    expect(final.matchesPlayed).toBe(15);
    expect(final.champion).not.toBeNull();
  });
});

describe("totalMatches formula", () => {
  it("(1 << totalRounds) - 1 gives correct match count for any bracket size", () => {
    const cases = [
      { n: 4,  rounds: 2, matches: 3  },
      { n: 8,  rounds: 3, matches: 7  },
      { n: 16, rounds: 4, matches: 15 },
    ];
    for (const { n, rounds, matches } of cases) {
      const b = buildBracket(makePhotos(n));
      expect(b.totalRounds).toBe(rounds);
      expect((1 << b.totalRounds) - 1).toBe(matches);
    }
  });

  it("is independent of total photos in DB (38 photos → 16-player bracket = 15 matches)", () => {
    const b = buildBracket(makePhotos(38));
    expect((1 << b.totalRounds) - 1).toBe(15);
  });
});
