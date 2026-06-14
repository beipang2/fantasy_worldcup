import { prisma } from "./db";

const VOTES_PER_HOUR = 30;

export async function isRateLimited(ip: string): Promise<boolean> {
  const since = new Date(Date.now() - 60 * 60 * 1000);
  const count = await prisma.vote.count({
    where: { ip, createdAt: { gte: since } },
  });
  return count >= VOTES_PER_HOUR;
}
