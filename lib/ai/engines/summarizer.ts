/**
 * summarizer.ts — Conversation summarization engine
 *
 * Called as a side-effect when the player FOCUSes away from a character.
 * Compresses the conversation into structured data.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import type { FocusResult } from "../../../types/actions";
import type { ConversationSummary } from "../../../types/state";
import { callTool } from "../client";
import { SUMMARIZE_TOOL } from "../tools";
import { conversationContext } from "../context";
import { buildSummarizationPrompt } from "../prompts/summarizer";

interface SummarizeToolResult {
  topicsDiscussed: string[];
  informationRevealed: string[];
  emotionalStateAfter: string;
  contradictionsExposed: string[];
  cluesDiscovered: string[];
  informationSpread: Record<string, string[]>;
  npcStateUpdates: Record<string, string>;
}

/**
 * Summarize a conversation. Returns the data needed for FocusResult.conversationEnded.
 */
export async function summarize(
  client: Anthropic,
  state: GameState,
  characterId: string,
): Promise<NonNullable<FocusResult["conversationEnded"]>> {
  const ctx = conversationContext(state.mystery, state, characterId);
  const { system, userMessage } = buildSummarizationPrompt(
    ctx,
    state.mystery,
  );

  const raw = await callTool<SummarizeToolResult>(
    client,
    system,
    [{ role: "user", content: userMessage }],
    SUMMARIZE_TOOL,
  );

  // Validate IDs
  const validContradictionIds = new Set(
    state.mystery.contradictions.map((c) => c.id),
  );
  const validClueIds = new Set(state.mystery.clues.map((c) => c.id));
  const validCharIds = new Set(state.mystery.characters.map((c) => c.id));

  const summary: ConversationSummary = {
    topicsDiscussed: raw.topicsDiscussed,
    informationRevealed: raw.informationRevealed,
    emotionalStateAfter: raw.emotionalStateAfter,
    contradictionsExposed: raw.contradictionsExposed.filter((id) =>
      validContradictionIds.has(id),
    ),
    cluesDiscovered: raw.cluesDiscovered.filter((id) =>
      validClueIds.has(id),
    ),
  };

  const informationSpread: Record<string, string[]> = {};
  for (const [charId, info] of Object.entries(raw.informationSpread)) {
    if (validCharIds.has(charId)) informationSpread[charId] = info;
  }

  const npcStateUpdates: Record<string, string> = {};
  for (const [charId, emotion] of Object.entries(raw.npcStateUpdates)) {
    if (validCharIds.has(charId)) npcStateUpdates[charId] = emotion;
  }

  return { characterId, summary, informationSpread, npcStateUpdates };
}
