/**
 * summarizer.ts — Prompt builder for conversation summarization
 *
 * Extracts structured summary from a conversation, determines
 * information spread, and suggests NPC emotional state updates.
 *
 * Design: rapport increases after conversation (people warm up when
 * you talk to them). Information spread is organic gossip, not
 * adversarial consequence.
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
  const { character, conversation, npcState, otherCharacters, relevantContradictions } =
    ctx;

  const transcript = conversation.messages
    .map(
      (m) =>
        `${m.role === "player" ? "PLAYER" : character.name.toUpperCase()}: ${m.content}`,
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

  const isNarrator = character.role === "narrator";

  const characterInfo = isNarrator
    ? `CHARACTER: ${character.name} (NARRATOR — case briefer, not a suspect)
- Personality: ${character.personality}
- Role: Guides the player, provides context and atmosphere`
    : `CHARACTER: ${character.name}
- Personality: ${character.personality}
- Secret: ${character.secret.description}
- Is guilty: ${character.isGuilty}`;

  const system = `You are a game engine analyzing a conversation from a ${mystery.genre} mystery.

${characterInfo}
- Current rapport: ${npcState.rapport}/100
- Current emotion: ${npcState.emotion}
${contradictionList}

TESTIMONIAL CLUES ${character.name} COULD REVEAL:
${testimonialClues || "None"}

OTHER CHARACTERS AND RELATIONSHIPS:
${relationshipList}

RAPPORT GUIDANCE:
Rapport generally INCREASES after conversation — people warm up when you engage with them. Consider:
- Did the player show genuine interest in ${character.name}'s perspective? → rapport increases more
- Did the player discuss ${character.name}'s interests (${character.interests.join(", ")})? → rapport increases more
- Was the conversation confrontational or dismissive? → rapport increases less (or stays flat)
- Did the player share useful information? → rapport increases
Suggest a rapportDelta between +2 and +15. Only suggest 0 or negative for genuinely hostile interactions.

INFORMATION SPREAD — ORGANIC GOSSIP:
When the player talks to ${character.name}, other characters may hear about it naturally:
- Close friends or allies hear details quickly — they talk
- People who are curious or nosy pick up fragments
- Dramatic moments (accusations, emotional outbursts, surprising revelations) spread widely
- Mundane small talk doesn't spread at all
- Enemies or strangers probably wouldn't hear unless it's dramatic

For npcStateUpdates, consider how hearing about this conversation would affect each character's emotional state. Only include characters who would realistically be affected.`;

  const userMessage = `Analyze this conversation:\n\n${transcript}`;

  return { system, userMessage };
}
