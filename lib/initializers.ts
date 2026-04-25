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
      cooperativeness: 100,
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

  return {
    mystery,
    phase: "playing",
    explorations: [],
    conversations: [],
    theories: [],
    npcStates: initNPCStates(mystery),
    focus: { type: "location", id: firstLocation.id },
    startedAt: Date.now(),
  };
}
