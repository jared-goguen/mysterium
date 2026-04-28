/**
 * state.ts — The Evolving Player Journey
 *
 * Three append-only event logs, cached AI-derived state,
 * and the player's current focus. All derived state is
 * recomputable from the logs + the mystery.
 */

import type { Mystery, Clue } from "./mystery";
// FocusTarget is defined in actions.ts and re-exported below
import type { FocusTarget } from "./actions";

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
  /** The examinable ID that was matched, if any. Used for prerequisite tracking. */
  examinableId: string | null;
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
// Theory log (timeline reconstruction attempts)
// ---------------------------------------------------------------------------

/** How close the player's reconstruction was to the truth. */
export type TheoryOutcome = "solved" | "close" | "wrong";

/** Per-moment evaluation from the AI judge. */
export interface MomentResult {
  momentId: string;
  /** 0–1 score for this moment. */
  score: number;
  /** Feedback: "Correct — Dolores entered via the back stairs" or hints. */
  feedback: string;
}

/**
 * A player's attempt to reconstruct the timeline.
 * Includes the AI's per-moment evaluation and overall score.
 */
export interface Theory {
  /** Player's freeform answer for each gap, keyed by moment ID. */
  answers: Record<string, string>;
  /** Clue IDs the player cited as evidence. */
  evidenceCited: string[];
  /** Per-moment evaluation. */
  momentResults: MomentResult[];
  /** Weighted overall score (0–1). */
  score: number;
  outcome: TheoryOutcome;
  /** Narrative consequence from the AI. */
  narrative: string;
  /** NPC emotional state changes. */
  npcStateChanges: Record<string, string>;
  /** Whether the mystery is solved (score ≥ threshold). */
  gameOver: boolean;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// NPC state (AI-computed, cached)
// ---------------------------------------------------------------------------

/**
 * The current state of an NPC as perceived by the player.
 * Updated after conversations and theory attempts.
 * Fed into future NPC interactions as context.
 */
export interface NPCState {
  characterId: string;
  /** Current emotional state: "nervous", "hostile", "calm", "terrified", etc. */
  emotion: string;
  /**
   * How much trust the player has built with this character (0–100).
   * Starts low (~40), increases with good conversation.
   * Higher rapport = character shares more personal/nuanced information.
   * Characters always talk; rapport affects depth, not availability.
   * Narrators always have rapport 100.
   */
  rapport: number;
  /** What this NPC knows about the investigation (information that spread to them). */
  awareness: string[];
}

// ---------------------------------------------------------------------------
// Focus — where the player is right now
// ---------------------------------------------------------------------------

// Re-export from actions.ts for convenience
export type { FocusTarget, FocusTargetType } from "./actions";

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
  theories: Theory[];

  // -- Cached AI-derived state --

  /** Current NPC states, keyed by character ID. */
  npcStates: Record<string, NPCState>;

  // -- Player position --

  focus: FocusTarget;

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

/** Number of failed theory attempts. */
export function failedTheoryCount(state: GameState): number {
  return state.theories.filter((t) => t.outcome !== "solved").length;
}

/** Get the conversation for a specific character, if any. */
export function getConversation(
  state: GameState,
  characterId: string,
): Conversation | undefined {
  return state.conversations.find((c) => c.characterId === characterId);
}
