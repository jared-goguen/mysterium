/**
 * summarizer.ts — Conversation summarization engine
 *
 * Compresses a conversation into structured data: topics, revelations,
 * emotional state, contradictions, information spread.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import type {
  EndConversationAction,
  EndConversationResult,
} from "../../../types/actions";
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

export async function summarize(
  client: Anthropic,
  state: GameState,
  action: EndConversationAction,
): Promise<EndConversationResult> {
  const ctx = conversationContext(state.mystery, state, action.characterId);
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

  // Validate contradiction IDs
  const validContradictionIds = new Set(
    state.mystery.contradictions.map((c) => c.id),
  );
  const contradictionsExposed = raw.contradictionsExposed.filter((id) => {
    if (!validContradictionIds.has(id)) {
      console.warn(`AI flagged unknown contradiction: "${id}", ignoring`);
      return false;
    }
    return true;
  });

  // Validate clue IDs
  const validClueIds = new Set(state.mystery.clues.map((c) => c.id));
  const cluesDiscovered = raw.cluesDiscovered.filter((id) => {
    if (!validClueIds.has(id)) {
      console.warn(`AI flagged unknown clue: "${id}", ignoring`);
      return false;
    }
    return true;
  });

  // Validate character IDs in informationSpread and npcStateUpdates
  const validCharIds = new Set(state.mystery.characters.map((c) => c.id));
  const informationSpread: Record<string, string[]> = {};
  for (const [charId, info] of Object.entries(raw.informationSpread)) {
    if (validCharIds.has(charId)) {
      informationSpread[charId] = info;
    }
  }
  const npcStateUpdates: Record<string, string> = {};
  for (const [charId, emotion] of Object.entries(raw.npcStateUpdates)) {
    if (validCharIds.has(charId)) {
      npcStateUpdates[charId] = emotion;
    }
  }

  const summary: ConversationSummary = {
    topicsDiscussed: raw.topicsDiscussed,
    informationRevealed: raw.informationRevealed,
    emotionalStateAfter: raw.emotionalStateAfter,
    contradictionsExposed,
    cluesDiscovered,
  };

  return { summary, informationSpread, npcStateUpdates };
}
