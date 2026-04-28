/**
 * validators.ts — Precondition checks for actions
 */

import type { GameState } from "../types/state";
import { discoveredClueIds } from "../types/state";
import type { Action } from "../types/actions";

export interface ValidationResult {
  valid: boolean;
  reason?: string;
}

const ok: ValidationResult = { valid: true };

function fail(reason: string): ValidationResult {
  return { valid: false, reason };
}

export function validateAction(
  state: GameState,
  action: Action,
): ValidationResult {
  if (state.phase === "solved" || state.phase === "revealed") {
    return fail("The investigation is over.");
  }

  if (state.phase !== "playing") {
    return fail("The game is not in progress.");
  }

  switch (action.type) {
    case "FOCUS": {
      const { target } = action;
      if (target.type === "location") {
        const location = state.mystery.locations.find(
          (l) => l.id === target.id,
        );
        if (!location) return fail(`Unknown location: ${target.id}`);
      } else if (target.type === "character") {
        const character = state.mystery.characters.find(
          (c) => c.id === target.id,
        );
        if (!character) return fail(`Unknown character: ${target.id}`);
        // Narrators are always accessible regardless of rapport
        // Regular characters are always available too (rapport affects
        // depth of sharing, not availability)
      }
      return ok;
    }

    case "INTERACT": {
      if (!action.message.trim()) {
        return fail(
          state.focus.type === "location"
            ? "What do you want to examine?"
            : "Say something.",
        );
      }
      return ok;
    }

    case "SOLVE": {
      const gaps = state.mystery.solution.moments.filter((m) => !m.isKnown);
      const answeredGaps = gaps.filter((g) => action.answers[g.id]?.trim());
      if (answeredGaps.length === 0) {
        return fail("Fill in at least one gap in the timeline.");
      }
      if (discoveredClueIds(state).size === 0) {
        return fail(
          "You need at least some evidence before presenting a theory.",
        );
      }
      return ok;
    }

    case "GIVE_UP": {
      return ok;
    }
  }
}
