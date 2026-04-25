/**
 * judge.ts — Prompt builder for accusation evaluation and give-up
 */

import type { AccusationContext } from "../context";
import type { Mystery } from "../../../types/mystery";
import type { AccuseAction } from "../../../types/actions";

export interface AccusationPrompt {
  system: string;
  userMessage: string;
}

export function buildAccusationPrompt(
  ctx: AccusationContext,
  accusation: AccuseAction,
): AccusationPrompt {
  const { solution, genre, characters, priorFailures, discoveredClueDescriptions } =
    ctx;

  const culpritName =
    characters.find((c) => c.id === solution.culprit)?.name ??
    solution.culprit;
  const accusedName =
    characters.find((c) => c.id === accusation.suspectId)?.name ??
    accusation.suspectId;

  const characterList = characters
    .map((c) => `- ${c.name} (${c.id}): ${c.personality}`)
    .join("\n");

  const clueList =
    discoveredClueDescriptions.length > 0
      ? discoveredClueDescriptions.map((d) => `- ${d}`).join("\n")
      : "No clues discovered";

  const system = `You are the game engine for a ${genre} mystery. Evaluate the player's accusation against the ground truth and generate dramatic consequences.

GROUND TRUTH:
- Culprit: ${culpritName} (${solution.culprit})
- Motive: ${solution.motive}
- Method: ${solution.method}
- Opportunity: ${solution.opportunity}

ALL CHARACTERS:
${characterList}

CLUES THE INVESTIGATOR HAS FOUND:
${clueList}

PREVIOUS WRONG ACCUSATIONS: ${priorFailures}

EVALUATION RULES:
- CORRECT: The accused IS the culprit AND the stated motive/method are substantially correct (doesn't need to be word-perfect, just captures the essential truth).
- PARTIAL: The accused IS the culprit BUT the motive or method is significantly wrong.
- WRONG: The accused is NOT the culprit.

NARRATIVE RULES:
- If CORRECT: Write a dramatic reveal scene. Show how the evidence locks together. Describe the culprit's reaction. 3-4 paragraphs, genre-appropriate.
- If PARTIAL: Acknowledge they found the right person but reveal the real motive/method. 2-3 paragraphs.
- If WRONG: Write the accused character's reaction IN CHARACTER based on their personality. Describe how other suspects react. The guilty party should become subtly [more careful or more emboldened]. 2-3 paragraphs.

For npcStateChanges: Every character should have an emotional reaction to the accusation.
For secretsRevealed: If a wrong accusation pushes an innocent suspect to break down and reveal their secret, include their ID.
gameOver is true ONLY for "correct" outcomes.`;

  const userMessage = `THE PLAYER'S ACCUSATION:
- Accused: ${accusedName} (${accusation.suspectId})
- Claimed motive: ${accusation.motive}
- Claimed method: ${accusation.method}
- Evidence cited: ${accusation.evidenceCited.length > 0 ? accusation.evidenceCited.join(", ") : "none"}`;

  return { system, userMessage };
}

export interface GiveUpPrompt {
  system: string;
  userMessage: string;
}

export function buildGiveUpPrompt(mystery: Mystery): GiveUpPrompt {
  const { solution, genre, characters } = mystery;

  const culpritName =
    characters.find((c) => c.id === solution.culprit)?.name ??
    solution.culprit;

  const secretsList = characters
    .map(
      (c) => `- ${c.name}: ${c.secret.description}`,
    )
    .join("\n");

  const system = `You are the narrator of a ${genre} mystery. The player has given up. Reveal the complete solution as a dramatic epilogue.

SOLUTION:
- Culprit: ${culpritName}
- Motive: ${solution.motive}
- Method: ${solution.method}
- Opportunity: ${solution.opportunity}

EVERYONE'S SECRETS:
${secretsList}

Write a 4-6 paragraph narrative epilogue revealing everything: who did it, how, why, and what every suspect was really hiding. Genre-appropriate tone. Make it feel like the final chapter of a mystery novel — satisfying even in defeat.`;

  const userMessage = "The investigator has given up. Reveal the truth.";

  return { system, userMessage };
}
