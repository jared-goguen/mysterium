/**
 * initializers.ts — Create a fresh GameState from a Mystery
 */

import type { Mystery } from "../types/mystery";
import type { GameState, NPCState } from "../types/state";

function initNPCStates(mystery: Mystery): Record<string, NPCState> {
  const states: Record<string, NPCState> = {};
  for (const character of mystery.characters) {
    states[character.id] = {
      characterId: character.id,
      emotion: "calm",
      // Narrators always at max rapport; suspects start at 40
      rapport: character.role === "narrator" ? 100 : 40,
      awareness: [],
    };
  }
  return states;
}

export function createGameState(mystery: Mystery): GameState {
  const firstLocation = mystery.locations[0];
  if (!firstLocation) {
    throw new Error("Mystery must have at least one location");
  }

  // If there's a narrator, start focused on them for the intro briefing.
  // Otherwise, start at the first location.
  const narrator = mystery.characters.find((c) => c.role === "narrator");
  const initialFocus = narrator
    ? { type: "character" as const, id: narrator.id }
    : { type: "location" as const, id: firstLocation.id };

  return {
    mystery,
    phase: "playing",
    explorations: [],
    conversations: [],
    theories: [],
    npcStates: initNPCStates(mystery),
    focus: initialFocus,
    startedAt: Date.now(),
  };
}
