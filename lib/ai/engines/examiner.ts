/**
 * examiner.ts — Location examination engine
 *
 * Matches player's freeform query to location examinables,
 * generates atmospheric narrative, discovers clues.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import type { InteractAction, ExamineInteractResult } from "../../../types/actions";
import { callTool } from "../client";
import { EXAMINE_TOOL } from "../tools";
import { locationContext } from "../context";
import { buildExaminePrompt } from "../prompts/examiner";

interface ExamineToolResult {
  narrative: string;
  clueFound: string | null;
  matchedExaminable: string | null;
}

export async function examine(
  client: Anthropic,
  state: GameState,
  action: InteractAction,
): Promise<ExamineInteractResult> {
  const ctx = locationContext(state.mystery, state, state.focus.id);
  const { system, userMessage } = buildExaminePrompt(ctx, action.message);

  const raw = await callTool<ExamineToolResult>(
    client,
    system,
    [{ role: "user", content: userMessage }],
    EXAMINE_TOOL,
  );

  let clueFound = raw.clueFound;
  if (clueFound) {
    const exists = state.mystery.clues.some((c) => c.id === clueFound);
    if (!exists) {
      console.warn(`AI returned unknown clue ID: "${clueFound}", ignoring`);
      clueFound = null;
    }
  }

  return {
    context: "location",
    narrative: raw.narrative,
    clueFound,
    matchedExaminable: raw.matchedExaminable,
  };
}
