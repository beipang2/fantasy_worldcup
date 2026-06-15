import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import TournamentView from "@/components/TournamentView";

// ── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({ t: (k: string) => k, locale: "en" as const }),
}));

vi.mock("@/components/Champion", () => ({
  default: ({ photo, onRestart }: { photo: { label: string | null }; onRestart: () => void }) => (
    <div data-testid="champion">
      {photo.label}
      <button onClick={onRestart}>Play Again</button>
    </div>
  ),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePhotos(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    url: `https://example.com/p${i}.jpg`,
    label: `Player ${i}`,
    rating: 1000,
    wins: 5,
    losses: 3,
  }));
}

/** Render TournamentView and wait for the initial bracket to populate. */
async function renderView(n: number) {
  render(<TournamentView photos={makePhotos(n)} locale="en" />);
  // Flush the synchronous useEffect that calls setBracket()
  await act(async () => {});
}

/** Click the first photo-card button and wait for handleVote's 700 ms delay to resolve. */
async function castVote() {
  const [firstCard] = screen.getAllByRole("button");
  fireEvent.click(firstCard);
  // waitFor polls until the state update lands (handles the 700 ms setTimeout inside handleVote)
  await waitFor(() => expect(screen.queryByText(/\d+ \/ \d+ matches/)).toBeTruthy(), {
    timeout: 2000,
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("TournamentView – progress bar", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows 0 / 15 matches for 16 photos (not DB total)", async () => {
    await renderView(16);
    expect(screen.getByText(/0 \/ 15 matches/)).toBeTruthy();
  });

  it("shows 0 / 7 matches for 8 photos", async () => {
    await renderView(8);
    expect(screen.getByText(/0 \/ 7 matches/)).toBeTruthy();
  });

  it("shows 0 / 3 matches for 4 photos", async () => {
    await renderView(4);
    expect(screen.getByText(/0 \/ 3 matches/)).toBeTruthy();
  });

  it("increments played count after a vote", async () => {
    await renderView(4);
    expect(screen.getByText(/0 \/ 3 matches/)).toBeTruthy();

    fireEvent.click(screen.getAllByRole("button")[0]);
    await waitFor(() => screen.getByText(/1 \/ 3 matches/), { timeout: 2000 });
  });
});

describe("TournamentView – picks grid", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("picks section is absent before any vote", async () => {
    await renderView(4);
    expect(screen.queryByText("Your picks")).toBeNull();
  });

  it("picks section appears after the first vote", async () => {
    await renderView(4);
    fireEvent.click(screen.getAllByRole("button")[0]);
    await waitFor(() => screen.getByText("Your picks"), { timeout: 2000 });
  });

  it("picks section resets when a new round starts (4-player = 2 votes per round)", async () => {
    await renderView(4);

    // Vote in both round-1 matches
    for (let i = 0; i < 2; i++) {
      fireEvent.click(screen.getAllByRole("button")[0]);
      await waitFor(
        () => expect(screen.queryByText(/\d+ \/ 3 matches/)).toBeTruthy(),
        { timeout: 2000 }
      );
    }

    // Round 2 starts — advancedPhotos resets so "Your picks" disappears
    await waitFor(() => expect(screen.queryByText("Your picks")).toBeNull(), {
      timeout: 2000,
    });
  });
});

describe("TournamentView – Play Again", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
  });

  it("Play Again resets the bracket and saves new bracket to sessionStorage", async () => {
    // Complete a 4-player bracket (3 total matches: 2 in round 1, 1 final)
    await renderView(4);

    // Vote through 2 round-1 matches and the final
    for (let expected = 1; expected <= 3; expected++) {
      fireEvent.click(screen.getAllByRole("button")[0]);
      if (expected < 3) {
        // Wait for match counter to increment before voting again
        await waitFor(() => screen.getByText(new RegExp(`${expected} \\/ 3 matches`)), { timeout: 2000 });
      }
    }

    await waitFor(() => screen.getByTestId("champion"), { timeout: 2000 });

    const savedBefore = JSON.parse(sessionStorage.getItem("h2h_bracket")!);
    expect(savedBefore.champion).not.toBeNull();

    fireEvent.click(screen.getByText("Play Again"));

    await waitFor(() => expect(screen.queryByTestId("champion")).toBeNull(), { timeout: 2000 });

    const savedAfter = JSON.parse(sessionStorage.getItem("h2h_bracket")!);
    expect(savedAfter.matchesPlayed).toBe(0);
    expect(savedAfter.champion).toBeNull();
  });
});
