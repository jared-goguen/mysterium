/**
 * initializers.ts — Create a fresh GameState from a Mystery
 *
 * The mystery is the cartridge. This function creates the save file.
 */

import type { Mystery } from "../types/mystery";
import type { GameState, NPCState } from "../types/state";

/**
 * Create initial NPC states from the mystery's character list.
 * Everyone starts calm and fully cooperative.
 */
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

/**
 * Create a fresh GameState from a Mystery.
 * Focus starts at the first location. All logs empty.
 */
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
    accusations: [],
    npcStates: initNPCStates(mystery),
    focus: { type: "location", id: firstLocation.id },
    startedAt: Date.now(),
  };
}
