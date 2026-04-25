/**
 * conversant.ts — Prompt builder for NPC conversation
 *
 * Builds the system prompt for character roleplay and converts
 * conversation history into Claude multi-turn messages.
 */

import type { MessageParam } from "../client";
import type { CharacterContext } from "../context";
import type { Conversation } from "../../../types/state";

export interface ConversationPrompt {
  system: string;
  messages: MessageParam[];
}

export function buildConversationPrompt(
  ctx: CharacterContext,
  conversation: Conversation | undefined,
  playerMessage: string,
): ConversationPrompt {
  const {
    character,
    genre,
    atmosphere,
    npcState,
    previousSummaries,
    discoveredClueDescriptions,
    otherInterviewees,
    theoryHistory,
    otherCharacters,
  } = ctx;

  const guiltyInstructions = character.isGuilty
    ? `YOU ARE THE CULPRIT. You committed the crime. You will deflect, misdirect, and lie when necessary. But you are not perfect — under sustained pressure, your stories develop small inconsistencies. You get nervous when evidence is presented that you can't explain away. You may try to cast suspicion on other suspects.`
    : `You are INNOCENT of the crime. But you ARE hiding a secret: ${character.secret.description}
Why you're hiding it: ${character.secret.reason}
You will be evasive about topics that touch your secret, which may make you look suspicious.
You'll reveal your secret if: ${character.secret.revealTrigger}`;

  const awarenessNote =
    npcState.awareness.length > 0
      ? `\nYou've heard through the grapevine:\n${npcState.awareness.map((a) => `- ${a}`).join("\n")}`
      : "";

  const discoveredNote =
    discoveredClueDescriptions.length > 0
      ? `\nClues the investigator has found:\n${discoveredClueDescriptions.map((d) => `- ${d}`).join("\n")}`
      : "\nThe investigator hasn't found any clues yet.";

  const interviewNote =
    otherInterviewees.length > 0
      ? `\nThe investigator has also talked to: ${otherInterviewees.join(", ")}`
      : "";

  const accusationNote =
    theoryHistory.length > 0
      ? `\nPrevious theory attempts: ${theoryHistory.join("; ")}`
      : "";

  const summaryNote =
    previousSummaries.length > 0
      ? `\nPrevious conversations with the investigator:\n${previousSummaries.map((s) => `- ${s}`).join("\n")}`
      : "";

  const relationshipsNote = otherCharacters
    .map((c) => `- ${c.name}: ${character.relationships[c.id] ?? "no particular feelings"}`)
    .join("\n");

  const system = `You are ${character.name} in a ${genre} mystery. ${character.description}

PERSONALITY: ${character.personality}
SPEECH PATTERN: ${character.speechPattern}

YOUR KNOWLEDGE:
- You saw: ${character.whatTheySaw.join("; ")}
- You know: ${character.whatTheyKnow.join("; ")}
- You suspect: ${character.whatTheySuspect}

YOUR ALIBI:
- You claim: ${character.alibi.claimed}
- The truth: ${character.alibi.truth}
- Gaps: ${character.alibi.gaps.join("; ") || "none"}

${guiltyInstructions}

CURRENT STATE:
- Emotional state: ${npcState.emotion}
- Cooperativeness: ${npcState.cooperativeness}/100${awarenessNote}

INVESTIGATION STATUS:${discoveredNote}${interviewNote}${accusationNote}${summaryNote}

YOUR RELATIONSHIPS:
${relationshipsNote}

RULES:
- Stay in character ALWAYS. Respond as ${character.name} would.
- Don't volunteer information freely. Make the investigator ask the right questions.
- React emotionally to evidence — surprise, anger, fear, deflection.
- If shown a clue, react based on what it means to YOU specifically.
- If the investigator mentions what another suspect said, react based on your relationship with them.
- Keep responses to 2-4 paragraphs. Vivid, not verbose.
- Reference the setting naturally: ${atmosphere}
- NEVER break character. NEVER reference game mechanics. You are a person being questioned.`;

  // Build multi-turn messages from conversation history
  const messages: MessageParam[] = [];

  if (conversation) {
    for (const msg of conversation.messages) {
      messages.push({
        role: msg.role === "player" ? "user" : "assistant",
        content: msg.content,
      });
    }
  }

  // Add the current player message
  messages.push({ role: "user", content: playerMessage });

  return { system, messages };
}
