/**
 * conversant.ts — NPC conversation engine
 *
 * Two-phase:
 *   1. Stream the NPC's in-character response (Sonnet for quality)
 *   2. Quick clue detection check (Haiku for speed)
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import { getConversation } from "../../../types/state";
import type { SayAction, SayResult } from "../../../types/actions";
import { streamChat, callTool } from "../client";
import { DETECT_CLUES_TOOL } from "../tools";
import { characterContext } from "../context";
import { buildConversationPrompt } from "../prompts/conversant";
import { buildClueDetectionPrompt } from "../prompts/clue-detector";

interface ClueDetectionResult {
  cluesRevealed: string[];
}

/**
 * Process a player message to an NPC.
 *
 * @param onDelta - Callback for streaming text chunks to the client.
 * @returns The complete SayResult after both phases finish.
 */
export async function converse(
  client: Anthropic,
  state: GameState,
  action: SayAction,
  onDelta?: (text: string) => void,
): Promise<SayResult> {
  const ctx = characterContext(state.mystery, state, action.characterId);
  const conversation = getConversation(state, action.characterId);

  // Phase 1: Stream the NPC response
  const { system, messages } = buildConversationPrompt(
    ctx,
    conversation,
    action.message,
  );

  const response = await streamChat(
    client,
    system,
    messages,
    onDelta,
    "quality",
  );

  // Phase 2: Check for revealed clues (skip if no testimonial clues available)
  let cluesRevealed: string[] = [];

  if (ctx.availableTestimonialClues.length > 0) {
    const { system: detectSystem, userMessage: detectMessage } =
      buildClueDetectionPrompt(
        ctx.character.name,
        response,
        ctx.availableTestimonialClues,
      );

    const detection = await callTool<ClueDetectionResult>(
      client,
      detectSystem,
      [{ role: "user", content: detectMessage }],
      DETECT_CLUES_TOOL,
      "fast",
    );

    // Validate: only keep clue IDs that actually exist and are available
    const availableIds = new Set(
      ctx.availableTestimonialClues.map((c) => c.id),
    );
    cluesRevealed = detection.cluesRevealed.filter((id) => {
      if (!availableIds.has(id)) {
        console.warn(`AI flagged unknown/unavailable clue: "${id}", ignoring`);
        return false;
      }
      return true;
    });
  }

  return { response, cluesRevealed };
}
