/**
 * actions.ts — State Transitions
 *
 * Four player actions:
 *   FOCUS    — navigate to a location or character
 *   INTERACT — context-dependent: examine (location) or speak (character)
 *   SOLVE    — present timeline reconstruction
 *   GIVE_UP  — reveal the full solution
 *
 * The game loop: action → AI engine → typed result → reducer → new state.
 */

import type { ConversationSummary, MomentResult, TheoryOutcome } from "./state";

// ---------------------------------------------------------------------------
// Focus target
// ---------------------------------------------------------------------------

export type FocusTargetType = "location" | "character";

export interface FocusTarget {
  type: FocusTargetType;
  id: string;
}

// ---------------------------------------------------------------------------
// Actions — what the player does
// ---------------------------------------------------------------------------

/**
 * Navigate to a location or character.
 *
 * Side-effect: if leaving a character with messages, the game loop
 * should trigger conversation summarization before applying the focus change.
 */
export interface FocusAction {
  type: "FOCUS";
  target: FocusTarget;
}

/**
 * Interact with the current focus target. Context-dependent:
 *   - Focused on a location → examine (freeform query)
 *   - Focused on a character → say something (conversation)
 */
export interface InteractAction {
  type: "INTERACT";
  message: string;
}

/** Present a timeline reconstruction — the player's theory of what happened. */
export interface SolveAction {
  type: "SOLVE";
  /** Player's freeform answer for each gap, keyed by moment ID. */
  answers: Record<string, string>;
  /** Clue IDs the player is citing as evidence. */
  evidenceCited: string[];
}

/** Give up — reveal the full solution. */
export interface GiveUpAction {
  type: "GIVE_UP";
}

export type Action =
  | FocusAction
  | InteractAction
  | SolveAction
  | GiveUpAction;

// ---------------------------------------------------------------------------
// Results — what the AI engine returns
// ---------------------------------------------------------------------------

/**
 * Result of a FOCUS action.
 * If the player was talking to a character, the conversation
 * is summarized and information spreads to other NPCs.
 */
export interface FocusResult {
  /** Present only if leaving a character with messages. */
  conversationEnded?: {
    characterId: string;
    summary: ConversationSummary;
    informationSpread: Record<string, string[]>;
    npcStateUpdates: Record<string, string>;
  };
}

/**
 * Result of an INTERACT action — shape depends on focus context.
 * The `context` discriminant tells the reducer which branch to apply.
 */
export type InteractResult =
  | ExamineInteractResult
  | SpeakInteractResult;

/** INTERACT at a location: examination. */
export interface ExamineInteractResult {
  context: "location";
  /** Atmospheric narrative of what was found. */
  narrative: string;
  /** Clue ID if an undiscovered clue was found, null otherwise. */
  clueFound: string | null;
}

/** INTERACT with a character: conversation. */
export interface SpeakInteractResult {
  context: "character";
  /** The NPC's in-character response. */
  response: string;
  /** Clue IDs revealed through this exchange. */
  cluesRevealed: string[];
}

/** Result of a SOLVE action — per-moment evaluation. */
export interface SolveResult {
  /** Per-moment feedback. */
  momentResults: MomentResult[];
  /** Weighted overall score (0–1). */
  score: number;
  /** Overall outcome. */
  outcome: TheoryOutcome;
  /** Narrative consequence. */
  narrative: string;
  /** NPC state changes. */
  npcStateChanges: Record<string, string>;
  /** True if score crosses the solve threshold. */
  gameOver: boolean;
}

/** Result of a GIVE_UP action. */
export interface GiveUpResult {
  /** Full narrative revealing the solution. */
  narrative: string;
}
