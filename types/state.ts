/**
 * state.ts — The Evolving Player Journey
 *
 * Three append-only event logs, cached AI-derived state,
 * and the player's current focus. All derived state is
 * recomputable from the logs + the mystery.
 */

import type { Mystery, Clue } from "./mystery";

// ---------------------------------------------------------------------------
// Exploration log
// ---------------------------------------------------------------------------

/** One thing the player examined at a location. */
export interface Exploration {
  locationId: string;
  /** What the player asked to examine: "the desk", "under the rug". */
  query: string;
  /** If this examination revealed a clue, the clue ID. Otherwise null. */
  clueFound: string | null;
  /** The AI's narrative response describing what was found. */
  narrative: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Conversation log
// ---------------------------------------------------------------------------

export type MessageRole = "player" | "npc";

export interface Message {
  role: MessageRole;
  content: string;
  timestamp: number;
}

/**
 * AI-generated summary of a conversation segment.
 * Created when the player leaves a conversation.
 * Compressed representation for feeding into future NPC interactions.
 */
export interface ConversationSummary {
  /** What topics were discussed. */
  topicsDiscussed: string[];
  /** New information the NPC revealed. */
  informationRevealed: string[];
  /** The NPC's emotional state after this conversation. */
  emotionalStateAfter: string;
  /** Contradiction IDs exposed during this conversation. */
  contradictionsExposed: string[];
  /** Clue IDs discovered through testimony. */
  cluesDiscovered: string[];
}

/** A conversation with a single character. Grows across multiple visits. */
export interface Conversation {
  characterId: string;
  /** Full message history across all visits. */
  messages: Message[];
  /** Summaries generated at the end of each visit. */
  summaries: ConversationSummary[];
  /** When this conversation was first started. */
  startedAt: number;
  /** When the last message was sent. */
  lastMessageAt: number;
}

// ---------------------------------------------------------------------------
// Accusation log
// ---------------------------------------------------------------------------

export type AccusationOutcome = "correct" | "partial" | "wrong";

/**
 * How the world changes after an accusation.
 * These are specific, actionable state changes — not just narrative.
 */
export interface AccusationConsequence {
  /** Human-readable narrative of what happened. */
  narrative: string;
  /** NPC emotional state changes: characterId → new emotion. */
  npcStateChanges: Record<string, string>;
  /** Secrets revealed as a result (character IDs whose secrets came out). */
  secretsRevealed: string[];
  /** Whether the game is over (true only on correct accusation). */
  gameOver: boolean;
}

export interface Accusation {
  /** Who the player accused. */
  suspectId: string;
  /** Player's theory of why they did it. */
  motive: string;
  /** Player's theory of how they did it. */
  method: string;
  /** Clue IDs the player cited as evidence. */
  evidenceCited: string[];
  outcome: AccusationOutcome;
  consequence: AccusationConsequence;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// NPC state (AI-computed, cached)
// ---------------------------------------------------------------------------

/**
 * The current state of an NPC as perceived by the player.
 * Updated after conversations and accusations.
 * Fed into future NPC interactions as context.
 */
export interface NPCState {
  characterId: string;
  /** Current emotional state: "nervous", "hostile", "calm", "terrified", etc. */
  emotion: string;
  /** How willing they are to talk. 0 = refuses, 100 = fully cooperative. */
  cooperativeness: number;
  /** What this NPC knows about the investigation (information that spread to them). */
  awareness: string[];
}

// ---------------------------------------------------------------------------
// Focus — where the player is right now
// ---------------------------------------------------------------------------

export type FocusType = "location" | "character";

export interface Focus {
  type: FocusType;
  /** Location ID or Character ID depending on focus type. */
  id: string;
}

// ---------------------------------------------------------------------------
// Game phase
// ---------------------------------------------------------------------------

export type GamePhase =
  | "generating"   // mystery is being created
  | "playing"      // investigation in progress
  | "solved"       // player correctly accused the culprit
  | "revealed";    // player gave up — solution shown

// ---------------------------------------------------------------------------
// GameState — the top-level composite
// ---------------------------------------------------------------------------

export interface GameState {
  /** Reference to the immutable mystery. */
  mystery: Mystery;

  /** Current game phase. */
  phase: GamePhase;

  // -- Append-only event logs --

  explorations: Exploration[];
  conversations: Conversation[];
  accusations: Accusation[];

  // -- Cached AI-derived state --

  /** Current NPC states, keyed by character ID. */
  npcStates: Record<string, NPCState>;

  // -- Player position --

  focus: Focus;

  /** When the game started. */
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Derived state — pure functions of the logs
// ---------------------------------------------------------------------------

/** Compute the set of clue IDs the player has discovered. */
export function discoveredClueIds(state: GameState): Set<string> {
  const ids = new Set<string>();
  for (const e of state.explorations) {
    if (e.clueFound) ids.add(e.clueFound);
  }
  for (const c of state.conversations) {
    for (const s of c.summaries) {
      for (const id of s.cluesDiscovered) {
        ids.add(id);
      }
    }
  }
  return ids;
}

/** Resolve discovered clue IDs to full Clue objects. */
export function discoveredClues(state: GameState): Clue[] {
  const ids = discoveredClueIds(state);
  return state.mystery.clues.filter((c) => ids.has(c.id));
}

/** Set of location IDs the player has visited. */
export function visitedLocationIds(state: GameState): Set<string> {
  return new Set(state.explorations.map((e) => e.locationId));
}

/** Set of character IDs the player has talked to. */
export function interviewedCharacterIds(state: GameState): Set<string> {
  return new Set(state.conversations.map((c) => c.characterId));
}

/** 0–1 progress through the evidence chain. */
export function investigationProgress(state: GameState): number {
  const total = state.mystery.clues.length;
  if (total === 0) return 0;
  return discoveredClueIds(state).size / total;
}

/** Number of wrong accusations made. */
export function failedAccusationCount(state: GameState): number {
  return state.accusations.filter((a) => a.outcome !== "correct").length;
}

/** Get the conversation for a specific character, if any. */
export function getConversation(
  state: GameState,
  characterId: string,
): Conversation | undefined {
  return state.conversations.find((c) => c.characterId === characterId);
}
