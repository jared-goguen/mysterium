/**
 * judge.ts — Prompt builders for timeline evaluation and give-up
 */

import type { SolutionContext } from "../context";
import type { Mystery } from "../../../types/mystery";
import type { SolveAction } from "../../../types/actions";

export interface SolvePrompt {
  system: string;
  userMessage: string;
}

export function buildSolvePrompt(
  ctx: SolutionContext,
  action: SolveAction,
): SolvePrompt {
  const { solution, genre, characters, priorFailures, discoveredClueDescriptions } = ctx;

  const characterList = characters
    .map((c) => `- ${c.name} (${c.id}): ${c.personality}`)
    .join("\n");

  const clueList =
    discoveredClueDescriptions.length > 0
      ? discoveredClueDescriptions.map((d) => `- ${d}`).join("\n")
      : "No clues discovered";

  // Build the moments section: known moments for context, gaps with ground truth + player answers
  const momentsSection = solution.moments
    .map((m) => {
      if (m.isKnown) {
        return `[KNOWN] ${m.time} — ${m.knownDescription}`;
      }
      const playerAnswer = action.answers[m.id] ?? "(no answer provided)";
      return [
        `[GAP] ${m.time} — "${m.prompt}"`,
        `  GROUND TRUTH: Location: ${m.truth.location}, People: ${m.truth.people.join(", ") || "none"}, Description: ${m.truth.description}`,
        `  PLAYER'S ANSWER: "${playerAnswer}"`,
        `  WEIGHT: ${m.weight}`,
      ].join("\n");
    })
    .join("\n\n");

  const gapIds = solution.moments.filter((m) => !m.isKnown).map((m) => m.id);

  const system = `You are the game engine for a ${genre} mystery. Evaluate the player's timeline reconstruction.

THE TIMELINE (known moments for context, gaps with ground truth and player answers):

${momentsSection}

ALL CHARACTERS:
${characterList}

CLUES THE PLAYER HAS FOUND:
${clueList}

PREVIOUS FAILED THEORIES: ${priorFailures}

EVALUATION RULES:
For each GAP, score the player's answer 0.0 to 1.0:
- 1.0: Correct on key facts (right people, right location, right action)
- 0.7-0.9: Mostly correct, minor details wrong or missing
- 0.4-0.6: Partially correct — got some elements right
- 0.1-0.3: On the wrong track but shows some understanding
- 0.0: Completely wrong or no answer

Consider:
- Did the player identify the right people at this moment?
- Did they understand what happened?
- Is their answer consistent with discoverable evidence?

NARRATIVE RULES:
- If overall score ≥ 0.75 (solved): Write a dramatic reveal confirming the player's reconstruction. Show how the pieces fit together. 3-4 paragraphs, genre-appropriate.
- If overall score 0.4–0.75 (close): Acknowledge what they got right, hint at what they missed. Encourage continued investigation. 2-3 paragraphs.
- If overall score < 0.4 (wrong): The theory doesn't hold up. NPCs react skeptically. Suggest the player needs more evidence. 2-3 paragraphs.

For npcStateChanges: characters react emotionally to the theory being presented.
gameOver is true ONLY when overall score ≥ 0.75.

You MUST evaluate every gap: ${gapIds.join(", ")}`;

  const userMessage = `Evaluate the player's timeline reconstruction. Respond using the evaluate_solution tool.`;

  return { system, userMessage };
}

export interface GiveUpPrompt {
  system: string;
  userMessage: string;
}

export function buildGiveUpPrompt(mystery: Mystery): GiveUpPrompt {
  const { solution, genre, characters } = mystery;

  const secretsList = characters
    .map((c) => `- ${c.name}: ${c.secret.description}`)
    .join("\n");

  const timelineSummary = solution.moments
    .map((m) => `${m.time}: ${m.truth.description}`)
    .join("\n");

  const system = `You are the narrator of a ${genre} mystery. The player has given up. Reveal the complete solution as a dramatic epilogue.

THE FULL TRUTH:
${solution.truth}

THE COMPLETE TIMELINE:
${timelineSummary}

EVERYONE'S SECRETS:
${secretsList}

Write a 4-6 paragraph narrative epilogue revealing everything: the full timeline of events and what every suspect was really hiding. Genre-appropriate tone. Make it feel like the final chapter of a mystery novel — satisfying even in defeat.`;

  const userMessage = "The investigator has given up. Reveal the truth.";

  return { system, userMessage };
}
