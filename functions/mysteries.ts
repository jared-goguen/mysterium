/**
 * mysteries.ts — Server-side mystery registry
 *
 * In-memory Map<string, Mystery> populated at module load.
 * Designed so the backing store can be swapped to KV later —
 * callers only use getMystery(), listMysteries(), and registerMystery().
 */

import type { Mystery } from "../types/mystery";
import type { MysteryListItem } from "../types/client";
import { stripToListItem } from "../types/client";
import blueParrot from "../examples/blue-parrot";
import crystalCourt from "../examples/crystal-court";

// ---------------------------------------------------------------------------
// Backing store (swap to KV later)
// ---------------------------------------------------------------------------

const store = new Map<string, Mystery>();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Retrieve a mystery by ID. Returns null if not found. */
export function getMystery(id: string): Mystery | null {
  return store.get(id) ?? null;
}

/** List all registered mysteries as lightweight list items. */
export function listMysteries(): MysteryListItem[] {
  return Array.from(store.values()).map(stripToListItem);
}

/** Register a mystery. Uses mystery.id as the key. */
export function registerMystery(mystery: Mystery): void {
  store.set(mystery.id, mystery);
}

// ---------------------------------------------------------------------------
// Seed with built-in mysteries
// ---------------------------------------------------------------------------

registerMystery(blueParrot);
registerMystery(crystalCourt);
