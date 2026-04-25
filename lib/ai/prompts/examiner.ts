/**
 * examiner.ts — Prompt builder for location examination
 *
 * Builds the system prompt that tells Claude about the location,
 * its examinable objects, and what the player has already found.
 */

import type { LocationContext } from "../context";

export interface ExaminePrompt {
  system: string;
  userMessage: string;
}

export function buildExaminePrompt(
  ctx: LocationContext,
  query: string,
): ExaminePrompt {
  const { location, genre, atmosphere, alreadyFoundHere, previousQueries } =
    ctx;

  const examinableList = location.examinables
    .map((e) => {
      const clueNote =
        e.clueId && !alreadyFoundHere.includes(e.clueId)
          ? `Contains clue "${e.clueId}".`
          : e.clueId && alreadyFoundHere.includes(e.clueId)
            ? "Clue already discovered here."
            : "No clue.";
      return [
        `- ID: "${e.id}" | Name: "${e.name}"`,
        `  Surface: ${e.surfaceDetail}`,
        `  On examine: ${e.onExamine}`,
        `  ${clueNote}`,
      ].join("\n");
    })
    .join("\n\n");

  const previousNote =
    previousQueries.length > 0
      ? `\nThe player has already examined: ${previousQueries.map((q) => `"${q}"`).join(", ")}`
      : "";

  const system = `You are the narrator of a ${genre} mystery game. You describe what the player finds when they examine things at a location. Write in the atmospheric style of the genre.

LOCATION: ${location.name}
${location.description}

EXAMINABLE OBJECTS:
${examinableList}
${previousNote}

RULES:
- If the player's query matches or is close to an examinable name, describe what they find using the "on examine" text as your guide. Embellish with atmospheric, genre-appropriate detail.
- If the examinable contains an undiscovered clue, include the discovery naturally in your narrative. Return the clue ID.
- If the clue at that examinable was already discovered, describe the object but note there's nothing new to find. Return null for clueFound.
- If the query doesn't match any examinable, describe the absence atmospherically — the player looked but found nothing noteworthy.
- Keep responses to 2-3 paragraphs. Vivid but not verbose.
- Setting atmosphere: ${atmosphere}`;

  return {
    system,
    userMessage: `I want to examine: ${query}`,
  };
}
