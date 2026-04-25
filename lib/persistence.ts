/**
 * persistence.ts — Serialize/deserialize GameState
 *
 * Handles saving and loading game state. The mystery is stored
 * separately from the game state (it's the shared "cartridge"),
 * but we serialize the full state including the mystery reference
 * for self-contained saves.
 */

import type { GameState } from "../types/state";

const SCHEMA_VERSION = 1;

interface SerializedGameState {
  version: number;
  state: GameState;
  savedAt: number;
}

/** Serialize a GameState to a JSON string. */
export function serialize(state: GameState): string {
  const envelope: SerializedGameState = {
    version: SCHEMA_VERSION,
    state,
    savedAt: Date.now(),
  };
  return JSON.stringify(envelope);
}

/** Deserialize a JSON string back to a GameState. */
export function deserialize(json: string): GameState {
  const envelope = JSON.parse(json) as SerializedGameState;

  if (!envelope.version || !envelope.state) {
    throw new Error("Invalid save data: missing version or state");
  }

  if (envelope.version > SCHEMA_VERSION) {
    throw new Error(
      `Save data is from a newer version (v${envelope.version}). ` +
        `This client supports up to v${SCHEMA_VERSION}.`,
    );
  }

  // Future: add migration logic here when SCHEMA_VERSION increments
  // if (envelope.version < SCHEMA_VERSION) { migrate(envelope); }

  return envelope.state;
}

/**
 * Save game state to localStorage (browser) or return the string (server).
 * Returns the serialized string for flexibility.
 */
export function saveToLocalStorage(
  state: GameState,
  key?: string,
): string {
  const json = serialize(state);
  const storageKey = key ?? `mysterium-save-${state.mystery.id}`;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(storageKey, json);
  }
  return json;
}

/** Load game state from localStorage. Returns null if not found. */
export function loadFromLocalStorage(
  mysteryId: string,
  key?: string,
): GameState | null {
  if (typeof localStorage === "undefined") return null;
  const storageKey = key ?? `mysterium-save-${mysteryId}`;
  const json = localStorage.getItem(storageKey);
  if (!json) return null;
  try {
    return deserialize(json);
  } catch {
    return null;
  }
}

/** List all saved mystery IDs in localStorage. */
export function listSaves(): string[] {
  if (typeof localStorage === "undefined") return [];
  const saves: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("mysterium-save-")) {
      saves.push(key.replace("mysterium-save-", ""));
    }
  }
  return saves;
}

/** Delete a save from localStorage. */
export function deleteSave(mysteryId: string, key?: string): void {
  if (typeof localStorage === "undefined") return;
  const storageKey = key ?? `mysterium-save-${mysteryId}`;
  localStorage.removeItem(storageKey);
}
