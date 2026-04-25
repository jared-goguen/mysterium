/**
 * summarizer.ts — Prompt builder for conversation summarization
 *
 * Extracts structured summary from a conversation, determines
 * information spread, and suggests NPC emotional state updates.
 */

import type { ConversationContext } from "../context";
import type { Mystery } from "../../../types/mystery";

export interface SummarizationPrompt {
  system: string;
  userMessage: string;
}

export function buildSummarizationPrompt(
  ctx: ConversationContext,
  mystery: Mystery,
): SummarizationPrompt {
  const { character, conversation, otherCharacters, relevantContradictions } =
    ctx;

  const transcript = conversation.messages
    .map(
      (m) =>
        `${m.role === "player" ? "INVESTIGATOR" : character.name.toUpperCase()}: ${m.content}`,
    )
    .join("\n\n");

  const contradictionList =
    relevantContradictions.length > 0
      ? `\nContradictions involving ${character.name}:\n${mystery.contradictions
          .filter((c) => relevantContradictions.includes(c.id))
          .map(
            (c) =>
              `- "${c.id}": ${c.characterA === character.id ? c.claimA : c.claimB} vs. the other party's claim`,
          )
          .join("\n")}`
      : "";

  const relationshipList = otherCharacters
    .map((c) => `- ${c.name} (${c.id}): ${c.relationship}`)
    .join("\n");

  // Testimonial clues this character could reveal
  const testimonialClues = mystery.clues
    .filter(
      (c) => c.type === "testimonial" && c.foundAt === character.id,
    )
    .map((c) => `- "${c.id}": ${c.description}`)
    .join("\n");

  const system = `You are a game engine analyzing a conversation from a ${mystery.genre} mystery.

CHARACTER: ${character.name}
- Personality: ${character.personality}
- Secret: ${character.secret.description}
- Is guilty: ${character.isGuilty}
${contradictionList}

TESTIMONIAL CLUES ${character.name} COULD REVEAL:
${testimonialClues || "None"}

OTHER CHARACTERS AND RELATIONSHIPS:
${relationshipList}

INFORMATION SPREAD RULES:
When the investigator discusses something with ${character.name}, other characters may hear about it based on relationships:
- Close allies or friends would hear about it quickly
- Enemies or strangers probably wouldn't hear
- Everyone would hear about dramatic events (accusations, emotional outbursts)
- Gossip travels — even neutral parties may pick up fragments

For npcStateUpdates, consider how hearing about this conversation would affect each character emotionally. Only include characters who would realistically be affected.`;

  const userMessage = `Analyze this conversation:\n\n${transcript}`;

  return { system, userMessage };
}
