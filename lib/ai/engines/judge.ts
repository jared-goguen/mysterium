/**
 * judge.ts — Accusation evaluation and give-up engine
 *
 * Evaluates player accusations against the ground truth,
 * generates dramatic consequences. Also handles give-up reveals.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import type {
  AccuseAction,
  AccuseResult,
  GiveUpResult,
} from "../../../types/actions";
import type { AccusationConsequence } from "../../../types/state";
import { callTool } from "../client";
import { EVALUATE_ACCUSATION_TOOL, GIVE_UP_TOOL } from "../tools";
import { accusationContext } from "../context";
import {
  buildAccusationPrompt,
  buildGiveUpPrompt,
} from "../prompts/judge";

interface AccusationToolResult {
  outcome: "correct" | "partial" | "wrong";
  narrative: string;
  npcStateChanges: Record<string, string>;
  secretsRevealed: string[];
  gameOver: boolean;
}

interface GiveUpToolResult {
  narrative: string;
}

export async function evaluate(
  client: Anthropic,
  state: GameState,
  action: AccuseAction,
): Promise<AccuseResult> {
  const ctx = accusationContext(state.mystery, state);
  const { system, userMessage } = buildAccusationPrompt(ctx, action);

  const raw = await callTool<AccusationToolResult>(
    client,
    system,
    [{ role: "user", content: userMessage }],
    EVALUATE_ACCUSATION_TOOL,
    "quality",
  );

  // Validate outcome enum
  const validOutcomes = ["correct", "partial", "wrong"] as const;
  const outcome = validOutcomes.includes(raw.outcome as any)
    ? raw.outcome
    : "wrong";

  // Validate character IDs in state changes and secrets
  const validCharIds = new Set(state.mystery.characters.map((c) => c.id));
  const npcStateChanges: Record<string, string> = {};
  for (const [charId, emotion] of Object.entries(raw.npcStateChanges)) {
    if (validCharIds.has(charId)) {
      npcStateChanges[charId] = emotion;
    }
  }
  const secretsRevealed = raw.secretsRevealed.filter((id) =>
    validCharIds.has(id),
  );

  // Enforce: gameOver is true ONLY for correct outcomes
  const gameOver = outcome === "correct";

  const consequence: AccusationConsequence = {
    narrative: raw.narrative,
    npcStateChanges,
    secretsRevealed,
    gameOver,
  };

  return { outcome, consequence };
}

export async function giveUp(
  client: Anthropic,
  state: GameState,
): Promise<GiveUpResult> {
  const { system, userMessage } = buildGiveUpPrompt(state.mystery);

  const raw = await callTool<GiveUpToolResult>(
    client,
    system,
    [{ role: "user", content: userMessage }],
    GIVE_UP_TOOL,
    "quality",
  );

  return { narrative: raw.narrative };
}
