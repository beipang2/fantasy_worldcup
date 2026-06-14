const K = 32;

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + 10 ** ((ratingB - ratingA) / 400));
}

export function computeNewRatings(
  ratingA: number,
  ratingB: number,
  winner: "A" | "B"
): { newA: number; newB: number } {
  const eA = expectedScore(ratingA, ratingB);
  const scoreA = winner === "A" ? 1 : 0;
  return {
    newA: ratingA + K * (scoreA - eA),
    newB: ratingB + K * (1 - scoreA - (1 - eA)),
  };
}
