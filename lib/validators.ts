/**
 * validators.ts — Precondition checks for actions
 *
 * Every action has preconditions. Check them before dispatching to the AI
 * engine or the reducer. Returns { valid, reason } — reason is human-readable
 * and can be shown in the UI.
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
  // No actions allowed if the game is over
  if (state.phase === "solved" || state.phase === "revealed") {
    if (action.type !== "GIVE_UP") {
      return fail("The investigation is over.");
    }
  }

  if (state.phase !== "playing") {
    return fail("The game is not in progress.");
  }

  switch (action.type) {
    case "MOVE": {
      const location = state.mystery.locations.find(
        (l) => l.id === action.locationId,
      );
      if (!location) {
        return fail(`Unknown location: ${action.locationId}`);
      }
      return ok;
    }

    case "EXAMINE": {
      if (state.focus.type !== "location") {
        return fail("You must be at a location to examine things.");
      }
      if (state.focus.id !== action.locationId) {
        return fail(
          `You're not at ${action.locationId}. Move there first.`,
        );
      }
      if (!action.query.trim()) {
        return fail("What do you want to examine?");
      }
      return ok;
    }

    case "TALK": {
      const character = state.mystery.characters.find(
        (c) => c.id === action.characterId,
      );
      if (!character) {
        return fail(`Unknown character: ${action.characterId}`);
      }
      // Check if the NPC refuses to talk (cooperativeness = 0)
      const npcState = state.npcStates[action.characterId];
      if (npcState && npcState.cooperativeness <= 0) {
        return fail(
          `${character.name} refuses to speak with you.`,
        );
      }
      return ok;
    }

    case "SAY": {
      if (state.focus.type !== "character") {
        return fail("You're not talking to anyone.");
      }
      if (state.focus.id !== action.characterId) {
        return fail(
          `You're not talking to ${action.characterId}.`,
        );
      }
      if (!action.message.trim()) {
        return fail("Say something.");
      }
      return ok;
    }

    case "END_CONVERSATION": {
      if (state.focus.type !== "character") {
        return fail("You're not in a conversation.");
      }
      if (state.focus.id !== action.characterId) {
        return fail(
          `You're not talking to ${action.characterId}.`,
        );
      }
      const conversation = state.conversations.find(
        (c) => c.characterId === action.characterId,
      );
      if (!conversation || conversation.messages.length === 0) {
        return fail("There's nothing to summarize — you haven't said anything.");
      }
      return ok;
    }

    case "ACCUSE": {
      const suspect = state.mystery.characters.find(
        (c) => c.id === action.suspectId,
      );
      if (!suspect) {
        return fail(`Unknown suspect: ${action.suspectId}`);
      }
      if (discoveredClueIds(state).size === 0) {
        return fail(
          "You need at least some evidence before making an accusation.",
        );
      }
      if (!action.motive.trim()) {
        return fail("You need to state a motive.");
      }
      if (!action.method.trim()) {
        return fail("You need to describe the method.");
      }
      return ok;
    }

    case "GIVE_UP": {
      return ok;
    }
  }
}
