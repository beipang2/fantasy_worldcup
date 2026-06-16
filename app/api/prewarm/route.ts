export const runtime = "edge";
export const preferredRegion = ["sin1", "hnd1"];

export async function GET(request: Request) {
  const start = Date.now();
  const region = process.env.VERCEL_REGION ?? "unknown";

  const base = new URL(request.url).origin;
  const res = await fetch(`${base}/api/prewarm/urls`);
  const { urls } = (await res.json()) as { urls: string[] };

  let fetched = 0;
  let errors = 0;

  for (let i = 0; i < urls.length; i += 20) {
    const batch = urls.slice(i, i + 20);
    await Promise.all(
      batch.map(async (url) => {
        try {
          await fetch(url, { method: "HEAD" });
          fetched++;
        } catch {
          errors++;
        }
      })
    );
  }

  return Response.json({ region, fetched, errors, durationMs: Date.now() - start });
}
