import { describe, it, expect } from "vitest";

// Mirrors the validation logic in app/api/card/route.ts
function isValidCardRequest(body: unknown): body is { photoId: string; card: "yellow" | "red" } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return false;
  const { photoId, card } = body as Record<string, unknown>;
  return typeof photoId === "string" && photoId.length > 0 && (card === "yellow" || card === "red");
}

describe("card request validation", () => {
  it("accepts a valid yellow card request", () => {
    expect(isValidCardRequest({ photoId: "clxyz123", card: "yellow" })).toBe(true);
  });

  it("accepts a valid red card request", () => {
    expect(isValidCardRequest({ photoId: "clxyz123", card: "red" })).toBe(true);
  });

  it("rejects missing photoId", () => {
    expect(isValidCardRequest({ card: "yellow" })).toBe(false);
  });

  it("rejects empty photoId", () => {
    expect(isValidCardRequest({ photoId: "", card: "yellow" })).toBe(false);
  });

  it("rejects invalid card type", () => {
    expect(isValidCardRequest({ photoId: "clxyz123", card: "blue" })).toBe(false);
  });

  it("rejects null", () => {
    expect(isValidCardRequest(null)).toBe(false);
  });

  it("rejects non-object", () => {
    expect(isValidCardRequest("yellow")).toBe(false);
  });
});
