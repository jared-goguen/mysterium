/**
 * mysteries.ts — Server-side mystery registry
 *
 * In-memory Map<string, Mystery> populated at module load.
 * Designed so the backing store can be swapped to KV later —
 * callers only use getMystery() and registerMystery().
 */

import type { Mystery } from "../types/mystery";
import blueParrot from "../examples/blue-parrot";

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

/** Register a mystery. Uses mystery.id as the key. */
export function registerMystery(mystery: Mystery): void {
  store.set(mystery.id, mystery);
}

// ---------------------------------------------------------------------------
// Seed with built-in mysteries
// ---------------------------------------------------------------------------

registerMystery(blueParrot);
