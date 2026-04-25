/**
 * judge.ts — Timeline evaluation and give-up engine
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { GameState } from "../../../types/state";
import type {
  SolveAction,
  SolveResult,
  GiveUpResult,
} from "../../../types/actions";
import type { MomentResult } from "../../../types/state";
import { callTool } from "../client";
import { EVALUATE_SOLUTION_TOOL, GIVE_UP_TOOL } from "../tools";
import { solutionContext } from "../context";
import { buildSolvePrompt, buildGiveUpPrompt } from "../prompts/judge";

interface SolveToolResult {
  momentResults: { momentId: string; score: number; feedback: string }[];
  score: number;
  outcome: "solved" | "close" | "wrong";
  narrative: string;
  npcStateChanges: Record<string, string>;
  gameOver: boolean;
}

interface GiveUpToolResult {
  narrative: string;
}

export async function evaluate(
  client: Anthropic,
  state: GameState,
  action: SolveAction,
): Promise<SolveResult> {
  const ctx = solutionContext(state.mystery, state);
  const { system, userMessage } = buildSolvePrompt(ctx, action);

  const raw = await callTool<SolveToolResult>(
    client,
    system,
    [{ role: "user", content: userMessage }],
    EVALUATE_SOLUTION_TOOL,
    "quality",
  );

  // Validate outcome
  const validOutcomes = ["solved", "close", "wrong"] as const;
  const outcome = validOutcomes.includes(raw.outcome as any)
    ? raw.outcome
    : "wrong";

  // Validate moment IDs
  const validMomentIds = new Set(
    state.mystery.solution.moments.filter((m) => !m.isKnown).map((m) => m.id),
  );
  const momentResults: MomentResult[] = raw.momentResults
    .filter((r) => validMomentIds.has(r.momentId))
    .map((r) => ({
      momentId: r.momentId,
      score: Math.max(0, Math.min(1, r.score)),
      feedback: r.feedback,
    }));

  // Validate character IDs in npcStateChanges
  const validCharIds = new Set(state.mystery.characters.map((c) => c.id));
  const npcStateChanges: Record<string, string> = {};
  for (const [charId, emotion] of Object.entries(raw.npcStateChanges)) {
    if (validCharIds.has(charId)) npcStateChanges[charId] = emotion;
  }

  // Enforce: gameOver only for solved
  const gameOver = outcome === "solved";

  return {
    momentResults,
    score: Math.max(0, Math.min(1, raw.score)),
    outcome,
    narrative: raw.narrative,
    npcStateChanges,
    gameOver,
  };
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
