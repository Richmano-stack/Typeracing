import { prisma } from "@/lib/prisma";

/**
 * ContentService
 *
 * Responsible for fetching typing prompt text from the database.
 * Keeps the route handler clean and allows easy swapping of the
 * selection strategy (e.g. difficulty filters, user history, etc.)
 */

export interface Prompt {
  id: string;
  content: string;
  difficulty: string;
}

/**
 * Fetches a single random TextPassage from the database.
 * Uses an offset-based random selection to stay within Prisma's ORM layer.
 *
 * @throws Error if no text passages exist in the database.
 */
export async function getRandomQuote(): Promise<Prompt> {
  const count = await prisma.textPassage.count();

  if (count === 0) {
    throw new Error("No text passages found in the database.");
  }

  const skip = Math.floor(Math.random() * count);

  const passage = await prisma.textPassage.findFirst({
    skip,
    select: {
      id: true,
      content: true,
      difficulty: true,
    },
  });

  // Fallback: skip might land on the last record and findFirst with skip=count
  // returns null on some DB drivers — re-fetch from the top in that case.
  if (!passage) {
    const fallback = await prisma.textPassage.findFirst({
      select: { id: true, content: true, difficulty: true },
    });
    if (!fallback) {
      throw new Error("No text passages found in the database.");
    }
    return fallback;
  }

  return passage;
}
