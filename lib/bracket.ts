export type Photo = {
  id: string;
  url: string;
  label: string | null;
  position?: string | null;
  nationality?: string | null;
  heightCm?: number | null;
  birthDate?: string | null;
  overallRating?: number | null;
};

export type Match = {
  a: Photo | null;
  b: Photo | null;
};

export type BracketState = {
  /** Matchups still to be played in the current round */
  queue: Match[];
  /** Winners advancing to the next round; null entries are byes */
  winners: (Photo | null)[];
  /** The overall champion once bracket is complete */
  champion: Photo | null;
  round: number;
  totalRounds: number;
  matchesPlayed: number;
  /** Current round picks only, newest first — resets at round boundary */
  advancedPhotos: Photo[];
  /** Per-round winner history. history[r] holds winners from round (r+1). Persists across rounds. */
  history: Photo[][];
};

/** Nearest power of 2 that is ≤ n */
function floorPow2(n: number): number {
  return Math.pow(2, Math.floor(Math.log2(n)));
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build the initial bracket from a list of photos. */
export function buildBracket(photos: Photo[]): BracketState {
  const size = Math.min(floorPow2(photos.length), 16);
  const seeded = shuffle(photos).slice(0, size);

  const queue: Match[] = [];
  for (let i = 0; i < seeded.length; i += 2) {
    queue.push({ a: seeded[i], b: seeded[i + 1] });
  }

  const totalRounds = Math.log2(size);
  const history: Photo[][] = Array.from({ length: totalRounds }, () => []);
  return { queue, winners: [], champion: null, round: 1, totalRounds, matchesPlayed: 0, advancedPhotos: [], history };
}

function buildNextRound(
  state: BracketState,
  queue: Match[],
  winners: (Photo | null)[],
  matchesPlayed: number,
  advancedPhotos: Photo[],
  history: Photo[][]
): BracketState {
  if (queue.length > 0) {
    return { ...state, queue, winners, matchesPlayed, advancedPhotos, history };
  }

  // Round over — check for champion (exactly one real winner, all others are byes)
  const real = winners.filter((w): w is Photo => w !== null);
  if (real.length === 1 && winners.length === 1) {
    return { queue: [], winners: [], champion: real[0], round: state.round, totalRounds: state.totalRounds, matchesPlayed, advancedPhotos, history };
  }

  // Build next round; null slots carry through as byes
  const nextQueue: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextQueue.push({ a: winners[i] ?? null, b: winners[i + 1] ?? null });
  }
  return { queue: nextQueue, winners: [], champion: null, round: state.round + 1, totalRounds: state.totalRounds, matchesPlayed, advancedPhotos: [], history };
}

/** Advance the bracket after a match. Returns the next state. */
export function advance(state: BracketState, winner: Photo): BracketState {
  const queue = state.queue.slice(1);
  const winners: (Photo | null)[] = [...state.winners, winner];
  const matchesPlayed = state.matchesPlayed + 1;
  const advancedPhotos = [winner, ...state.advancedPhotos];

  const history = state.history.map((arr, i) =>
    i === state.round - 1 ? [...arr, winner] : arr
  );

  return buildNextRound(state, queue, winners, matchesPlayed, advancedPhotos, history);
}

/**
 * Advance when both players in a match are carded — pushes a null bye into
 * the next round instead of a real winner.
 */
export function advanceWithBye(state: BracketState): BracketState {
  const queue = state.queue.slice(1);
  const winners: (Photo | null)[] = [...state.winners, null];
  const matchesPlayed = state.matchesPlayed + 1;
  // No advancedPhotos or history update for a bye

  return buildNextRound(state, queue, winners, matchesPlayed, state.advancedPhotos, state.history);
}
