/**
 * clue-detector.ts — Prompt builder for post-hoc clue detection
 *
 * After an NPC responds, this quick call checks whether the response
 * contained testimony that reveals any undiscovered clues.
 */

import type { Clue } from "../../../types/mystery";

export interface ClueDetectionPrompt {
  system: string;
  userMessage: string;
}

export function buildClueDetectionPrompt(
  characterName: string,
  npcResponse: string,
  availableClues: Clue[],
): ClueDetectionPrompt {
  if (availableClues.length === 0) {
    // No clues to detect — but we still need a valid prompt shape.
    // The engine should short-circuit before calling this.
    return {
      system: "No testimonial clues available for this character.",
      userMessage: "No clues to check.",
    };
  }

  const clueList = availableClues
    .map(
      (c) =>
        `- ID: "${c.id}" | Description: ${c.description}\n  Reveal trigger: ${c.foundVia}`,
    )
    .join("\n");

  const system = `You are a game engine analyzing NPC dialogue for clue revelations.

${characterName} could potentially reveal these clues through testimony:
${clueList}

A clue counts as "revealed" if the NPC's response contains testimony that substantively communicates the information described in the clue — not merely touching on the topic, but actually sharing the key fact. The player should now know something they didn't before.

Be conservative: only flag a clue as revealed if the NPC clearly communicated the clue's core information.`;

  const userMessage = `${characterName} just said:\n\n"${npcResponse}"\n\nWhich clues, if any, were revealed?`;

  return { system, userMessage };
}
