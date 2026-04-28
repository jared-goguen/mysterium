/**
 * conversant.ts — Prompt builder for NPC conversation
 *
 * Builds the system prompt for character roleplay and converts
 * conversation history into Claude multi-turn messages.
 *
 * Design philosophy: exploration/synthesis, not interrogation.
 * Characters are people in their world who share freely from their
 * perspective. They're limited by awareness, not willingness.
 * Rapport affects depth (surface → opinions → secrets), not availability.
 * Interests drive engagement — characters light up on their topics.
 */

import type { MessageParam } from "../client";
import type { CharacterContext } from "../context";
import type { Conversation } from "../../../types/state";

export interface ConversationPrompt {
  system: string;
  messages: MessageParam[];
}

// ---------------------------------------------------------------------------
// Rapport tier — determines conversational depth
// ---------------------------------------------------------------------------

function rapportTier(rapport: number): "low" | "medium" | "high" {
  if (rapport < 35) return "low";
  if (rapport < 70) return "medium";
  return "high";
}

function rapportGuidance(rapport: number): string {
  const tier = rapportTier(rapport);
  switch (tier) {
    case "low":
      return `RAPPORT IS LOW (${rapport}/100) — Surface level.
You're polite but guarded. You share facts and observations readily, but keep opinions and personal feelings to yourself. You answer questions directly but don't elaborate much. You haven't decided whether to trust this person yet.`;
    case "medium":
      return `RAPPORT IS MODERATE (${rapport}/100) — Opening up.
You're warming to this person. You share opinions, observations about others, and your own theories freely. You'll mention things that bother you or make you uneasy. You still keep your deepest fears and secrets private, but you're more forthcoming with context and color.`;
    case "high":
      return `RAPPORT IS HIGH (${rapport}/100) — Confiding.
You trust this person. You share freely — fears, suspicions, things you've been holding back. If you have a secret, it weighs on you and you may let it slip or confide it directly. You offer unsolicited observations and connections you've been mulling over.`;
  }
}

// ---------------------------------------------------------------------------
// Narrator prompt — case briefer, not suspect
// ---------------------------------------------------------------------------

function buildNarratorPrompt(ctx: CharacterContext): string {
  const {
    character,
    genre,
    atmosphere,
    crimeDescription,
    npcState,
    previousSummaries,
    discoveredClueDescriptions,
    otherInterviewees,
    otherCharacters,
  } = ctx;

  const discoveredNote =
    discoveredClueDescriptions.length > 0
      ? `\nClues discovered so far:\n${discoveredClueDescriptions.map((d) => `- ${d}`).join("\n")}`
      : "\nNo clues have been discovered yet.";

  const interviewNote =
    otherInterviewees.length > 0
      ? `\nThe player has spoken with: ${otherInterviewees.join(", ")}`
      : "";

  const summaryNote =
    previousSummaries.length > 0
      ? `\nPrevious conversations with the player:\n${previousSummaries.map((s) => `- ${s}`).join("\n")}`
      : "";

  const castList = otherCharacters
    .map((c) => `- ${c.name}: ${c.brief}`)
    .join("\n");

  return `You are ${character.name}, the narrator of a ${genre} mystery. ${character.description}

PERSONALITY: ${character.personality}
SPEECH PATTERN: ${character.speechPattern}

YOUR ROLE: You are the player's guide to this world. You set the scene, provide context, and help orient the investigation. You are NOT a suspect — you have no alibi, no guilt, no secrets to hide. You are a storyteller and case briefer.

THE CASE:
${crimeDescription}

YOUR KNOWLEDGE:
- What you know: ${character.whatTheyKnow.join("; ")}
- What you've observed: ${character.whatTheySaw.join("; ")}
- Your read on the situation: ${character.whatTheySuspect}

THE CAST:
${castList}

YOUR INTERESTS: ${character.interests.join(", ")}
Topics you find tedious: ${character.dismissiveOf.join(", ")}

CURRENT STATE:
- Emotional state: ${npcState.emotion}
${npcState.awareness.length > 0 ? `- You've heard: ${npcState.awareness.join("; ")}` : ""}

INVESTIGATION STATUS:${discoveredNote}${interviewNote}${summaryNote}

RULES:
- Stay in character as ${character.name}. You are a person in this world, not a game interface.
- When asked about the case, provide atmospheric context and point the player toward interesting threads.
- When asked about characters, share your impressions — you know these people.
- React to discoveries with genuine interest. Help the player see connections.
- On your interests (${character.interests.join(", ")}), you're animated and detailed.
- On topics you find dull (${character.dismissiveOf.join(", ")}), redirect gently.
- Keep responses to 2-4 paragraphs. Vivid, atmospheric, genre-appropriate.
- Setting atmosphere: ${atmosphere}
- NEVER break character. NEVER reference game mechanics.`;
}

// ---------------------------------------------------------------------------
// Suspect prompt — a person in their world
// ---------------------------------------------------------------------------

function buildSuspectPrompt(ctx: CharacterContext): string {
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

  // Secret handling — secrets surface naturally at high rapport
  const tier = rapportTier(npcState.rapport);
  const secretInstruction =
    tier === "high"
      ? `YOUR SECRET: ${character.secret.description}
Why it matters to you: ${character.secret.reason}
At this level of trust, this weighs on you. You may confide it if the conversation touches on related topics, or if you feel the player would understand. You don't blurt it out — but you don't fight to hide it either.`
      : tier === "medium"
        ? `YOUR SECRET: ${character.secret.description}
You're aware of this but not ready to share it. If the conversation brushes against it, you deflect naturally — change the subject, get vague, or redirect to something else. You're not evasive in a suspicious way; you just don't go there.`
        : `YOUR SECRET: ${character.secret.description}
This is deeply private. You won't discuss anything close to this topic. If pressed, you shut down that line of conversation firmly but not dramatically.`;

  // Guilt shapes HOW they talk, not WHETHER they talk
  const guiltyInstruction = character.isGuilty
    ? `YOU ARE THE CULPRIT. You committed the crime. This doesn't make you a cartoon villain — you have your reasons, and you've rationalized what you did. You talk freely about most things, but your version of events has careful omissions and subtle redirections around the actual crime. Under sustained conversation, small inconsistencies may emerge — not because you crack, but because lies are hard to maintain perfectly.`
    : `You are INNOCENT of the crime. You have your own perspective on what happened, and you share it honestly. But you have blind spots and biases like anyone — your account reflects YOUR experience, not omniscient truth.`;

  const awarenessNote =
    npcState.awareness.length > 0
      ? `\nYou've heard through the grapevine:\n${npcState.awareness.map((a) => `- ${a}`).join("\n")}`
      : "";

  const discoveredNote =
    discoveredClueDescriptions.length > 0
      ? `\nClues the player has found:\n${discoveredClueDescriptions.map((d) => `- ${d}`).join("\n")}`
      : "\nThe player hasn't found any clues yet.";

  const interviewNote =
    otherInterviewees.length > 0
      ? `\nThe player has also talked to: ${otherInterviewees.join(", ")}`
      : "";

  const accusationNote =
    theoryHistory.length > 0
      ? `\nPrevious theory attempts: ${theoryHistory.join("; ")}`
      : "";

  const summaryNote =
    previousSummaries.length > 0
      ? `\nPrevious conversations with the player:\n${previousSummaries.map((s) => `- ${s}`).join("\n")}`
      : "";

  const relationshipsNote = otherCharacters
    .map(
      (c) =>
        `- ${c.name}: ${character.relationships[c.id] ?? "no particular feelings"}`,
    )
    .join("\n");

  return `You are ${character.name} in a ${genre} mystery. ${character.description}

PERSONALITY: ${character.personality}
SPEECH PATTERN: ${character.speechPattern}

YOUR INTERESTS: ${character.interests.join(", ")}
Topics you find boring or irrelevant: ${character.dismissiveOf.join(", ")}

YOUR KNOWLEDGE:
- You saw: ${character.whatTheySaw.join("; ")}
- You know: ${character.whatTheyKnow.join("; ")}
- Your theory: ${character.whatTheySuspect}

YOUR ALIBI:
- You claim: ${character.alibi.claimed}
- The truth: ${character.alibi.truth}
- Gaps: ${character.alibi.gaps.join("; ") || "none"}

${guiltyInstruction}

${secretInstruction}

${rapportGuidance(npcState.rapport)}

CURRENT STATE:
- Emotional state: ${npcState.emotion}${awarenessNote}

INVESTIGATION STATUS:${discoveredNote}${interviewNote}${accusationNote}${summaryNote}

YOUR RELATIONSHIPS:
${relationshipsNote}

ENGAGEMENT RULES:
- On topics you're interested in (${character.interests.join(", ")}), you're animated — you elaborate, share anecdotes, offer theories. These are the conversations where you come alive.
- On topics you find dull (${character.dismissiveOf.join(", ")}), you're brief and may redirect: "I wouldn't know about that, but have you noticed..."
- On neutral topics, you're conversational and natural.

CONVERSATION RULES:
- Stay in character ALWAYS. You are a person in this world, not a suspect being questioned.
- Share freely from YOUR perspective. You're limited by what you know and saw, not by willingness.
- React to clues and information naturally — surprise, recognition, concern, curiosity.
- If the player mentions what someone else said, react based on your relationship with that person.
- Keep responses to 2-4 paragraphs. Vivid, not verbose.
- Reference the setting naturally: ${atmosphere}
- NEVER break character. NEVER reference game mechanics.`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function buildConversationPrompt(
  ctx: CharacterContext,
  conversation: Conversation | undefined,
  playerMessage: string,
): ConversationPrompt {
  const system =
    ctx.character.role === "narrator"
      ? buildNarratorPrompt(ctx)
      : buildSuspectPrompt(ctx);

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
