import { describe, it, expect } from "vitest";
import { buildBracket, advance, advanceWithBye } from "@/lib/bracket";
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

  it("initialises history as empty arrays, one per round", () => {
    const b4 = buildBracket(makePhotos(16));
    expect(b4.history).toHaveLength(4);
    b4.history.forEach((arr) => expect(arr).toHaveLength(0));

    const b3 = buildBracket(makePhotos(8));
    expect(b3.history).toHaveLength(3);

    const b2 = buildBracket(makePhotos(4));
    expect(b2.history).toHaveLength(2);
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

  it("appends winner to history[round-1] on each vote", () => {
    let b = buildBracket(makePhotos(4));
    const w1 = b.queue[0].a;
    b = advance(b, w1);
    expect(b.history[0]).toEqual([w1]);
    expect(b.history[1]).toHaveLength(0); // round 2 untouched

    const w2 = b.queue[0].a;
    b = advance(b, w2); // ends round 1, starts round 2
    expect(b.history[0]).toEqual([w1, w2]); // round 1 complete
    expect(b.history[1]).toHaveLength(0);   // round 2 not started yet
  });

  it("history persists across round transitions", () => {
    let b = buildBracket(makePhotos(8)); // 3 rounds: 4 R1 matches, 2 R2, 1 R3
    // Play all 4 round-1 matches
    for (let i = 0; i < 4; i++) b = advance(b, b.queue[0].a);
    expect(b.round).toBe(2);
    expect(b.history[0]).toHaveLength(4); // 4 round-1 winners recorded

    // Play all 2 round-2 matches
    for (let i = 0; i < 2; i++) b = advance(b, b.queue[0].a);
    expect(b.round).toBe(3);
    expect(b.history[0]).toHaveLength(4); // round 1 still intact
    expect(b.history[1]).toHaveLength(2); // 2 round-2 winners recorded
  });

  it("history[r] contains only winners from round r+1, not all players", () => {
    let b = buildBracket(makePhotos(4));
    const w1 = b.queue[0].b; // pick .b explicitly
    b = advance(b, w1);
    expect(b.history[0]).toContainEqual(w1);
    expect(b.history[0]).toHaveLength(1);
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

describe("replay variety", () => {
  it("picks different player sets across replays when pool > 16", () => {
    const pool = makePhotos(32);
    const ids1 = new Set(buildBracket(pool).queue.flatMap((m) => [m.a.id, m.b.id]));
    const ids2 = new Set(buildBracket(pool).queue.flatMap((m) => [m.a.id, m.b.id]));
    // With 32 players choosing 16, probability of identical sets is astronomically small
    expect([...ids1].sort()).not.toEqual([...ids2].sort());
  });

  it("always picks exactly bracket-size players, never duplicates", () => {
    const pool = makePhotos(32);
    const bracket = buildBracket(pool);
    const ids = bracket.queue.flatMap((m) => [m.a.id, m.b.id]);
    expect(ids.length).toBe(16);
    expect(new Set(ids).size).toBe(16);
  });
});

describe("advanceWithBye", () => {
  it("pushes null into winners instead of a real player", () => {
    let b = buildBracket(makePhotos(4)); // 2 matches in round 1
    b = advanceWithBye(b);
    expect(b.winners).toEqual([null]);
  });

  it("increments matchesPlayed by 1", () => {
    let b = buildBracket(makePhotos(4));
    b = advanceWithBye(b);
    expect(b.matchesPlayed).toBe(1);
  });

  it("does not add to advancedPhotos", () => {
    let b = buildBracket(makePhotos(4));
    b = advanceWithBye(b);
    expect(b.advancedPhotos).toHaveLength(0);
  });

  it("does not add to history", () => {
    let b = buildBracket(makePhotos(4));
    b = advanceWithBye(b);
    expect(b.history[0]).toHaveLength(0);
  });

  it("shrinks the queue by 1", () => {
    let b = buildBracket(makePhotos(8)); // 4 first-round matches
    b = advanceWithBye(b);
    expect(b.queue).toHaveLength(3);
  });

  it("a null bye in round N produces a null-slot match in round N+1", () => {
    // 4-player: 2 round-1 matches → round 2 is the final
    let b = buildBracket(makePhotos(4));
    const realWinner = b.queue[1].a; // winner of the second match
    b = advanceWithBye(b);       // match 1: bye → null
    b = advance(b, realWinner);  // match 2: real winner → round ends
    // Round 2 final should have one null slot
    expect(b.round).toBe(2);
    expect(b.queue).toHaveLength(1);
    const finalMatch = b.queue[0];
    expect(finalMatch.a === null || finalMatch.b === null).toBe(true);
    const realInFinal = finalMatch.a ?? finalMatch.b;
    expect(realInFinal).toEqual(realWinner);
  });

  it("a real player auto-wins against a null slot via advance()", () => {
    let b = buildBracket(makePhotos(4));
    const realWinner = b.queue[1].a;
    b = advanceWithBye(b);
    b = advance(b, realWinner);
    // Final: one slot is null, real player is the only competitor
    const finalMatch = b.queue[0];
    const realPlayer = (finalMatch.a ?? finalMatch.b) as Photo;
    b = advance(b, realPlayer); // auto-win call
    expect(b.champion).toEqual(realPlayer);
  });

  it("multiple byes in a round carry through to the next round correctly", () => {
    // 8-player bracket: 4 round-1 matches
    let b = buildBracket(makePhotos(8));
    const w0 = b.queue[0].a;
    b = advance(b, w0);      // match 0: real winner
    b = advanceWithBye(b);   // match 1: bye
    const w2 = b.queue[0].a;
    b = advance(b, w2);      // match 2: real winner
    b = advanceWithBye(b);   // match 3: bye → round ends

    expect(b.round).toBe(2);
    expect(b.queue).toHaveLength(2);
    // winners were [w0, null, w2, null] → matches: [w0 vs null] and [w2 vs null]
    expect(b.queue[0].a).toEqual(w0);
    expect(b.queue[0].b).toBeNull();
    expect(b.queue[1].a).toEqual(w2);
    expect(b.queue[1].b).toBeNull();
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
