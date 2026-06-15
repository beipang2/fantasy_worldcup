export type Photo = {
  id: string;
  url: string;
  label: string | null;
  position?: string | null;
  nationality?: string | null;
  heightCm?: number | null;
};

export type Match = {
  a: Photo;
  b: Photo;
};

export type BracketState = {
  /** Matchups still to be played in the current round */
  queue: Match[];
  /** Winners advancing to the next round */
  winners: Photo[];
  /** The overall champion once bracket is complete */
  champion: Photo | null;
  round: number;
  totalRounds: number;
  matchesPlayed: number;
  /** All picks so far, newest first — never resets between rounds */
  advancedPhotos: Photo[];
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
  return { queue, winners: [], champion: null, round: 1, totalRounds, matchesPlayed: 0, advancedPhotos: [] };
}

/** Advance the bracket after a match. Returns the next state. */
export function advance(state: BracketState, winner: Photo): BracketState {
  const queue = state.queue.slice(1);
  const winners = [...state.winners, winner];
  const matchesPlayed = state.matchesPlayed + 1;
  const advancedPhotos = [winner, ...state.advancedPhotos];

  // More matches in this round
  if (queue.length > 0) {
    return { ...state, queue, winners, matchesPlayed, advancedPhotos };
  }

  // Round over — champion or build next round
  if (winners.length === 1) {
    return { queue: [], winners: [], champion: winners[0], round: state.round, totalRounds: state.totalRounds, matchesPlayed, advancedPhotos };
  }

  const nextQueue: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextQueue.push({ a: winners[i], b: winners[i + 1] });
  }

  return { queue: nextQueue, winners: [], champion: null, round: state.round + 1, totalRounds: state.totalRounds, matchesPlayed, advancedPhotos: [] };
}
