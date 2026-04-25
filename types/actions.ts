/**
 * actions.ts — State Transitions
 *
 * Every player action is one of these. Each defines:
 *   - what the player did
 *   - what context the AI engine needs
 *   - what the resulting state change looks like
 *
 * The game loop: player action → AI engine → state transition → UI update.
 */

import type { AccusationConsequence, AccusationOutcome, ConversationSummary } from "./state";

// ---------------------------------------------------------------------------
// Actions — what the player does
// ---------------------------------------------------------------------------

/** Player moves to a location. Triggers an implicit "look around". */
export interface MoveAction {
  type: "MOVE";
  locationId: string;
}

/**
 * Player examines something at the current location.
 * Freeform text — "look at the desk", "check under the rug".
 */
export interface ExamineAction {
  type: "EXAMINE";
  locationId: string;
  query: string;
}

/** Player says something to the current NPC. */
export interface SayAction {
  type: "SAY";
  characterId: string;
  message: string;
}

/**
 * Player ends the current conversation.
 * Triggers AI summarization and information spread.
 */
export interface EndConversationAction {
  type: "END_CONVERSATION";
  characterId: string;
}

/** Player starts talking to a character. */
export interface TalkAction {
  type: "TALK";
  characterId: string;
}

/** Player presents their accusation. */
export interface AccuseAction {
  type: "ACCUSE";
  suspectId: string;
  /** Player's theory of motive — free text. */
  motive: string;
  /** Player's theory of method — free text. */
  method: string;
  /** Clue IDs the player is citing as evidence. */
  evidenceCited: string[];
}

/** Player gives up — reveal the solution. */
export interface GiveUpAction {
  type: "GIVE_UP";
}

export type Action =
  | MoveAction
  | ExamineAction
  | SayAction
  | EndConversationAction
  | TalkAction
  | AccuseAction
  | GiveUpAction;

// ---------------------------------------------------------------------------
// Results — what the AI engine returns
// ---------------------------------------------------------------------------

/** Result of an EXAMINE action. */
export interface ExamineResult {
  /** The AI's atmospheric narrative of what was found. */
  narrative: string;
  /** If a clue was discovered, its ID. */
  clueFound: string | null;
}

/** Result of a SAY action — the NPC's response. */
export interface SayResult {
  /** The NPC's in-character response. */
  response: string;
  /**
   * Clue IDs revealed through this exchange, if any.
   * Testimonial clues emerge during conversation.
   */
  cluesRevealed: string[];
}

/** Result of an END_CONVERSATION action. */
export interface EndConversationResult {
  /** Compressed summary of the conversation. */
  summary: ConversationSummary;
  /**
   * Information spread to other NPCs.
   * Map of characterId → what they now know about.
   */
  informationSpread: Record<string, string[]>;
  /** Updated NPC emotional states after information spreads. */
  npcStateUpdates: Record<string, string>;
}

/** Result of an ACCUSE action. */
export interface AccuseResult {
  outcome: AccusationOutcome;
  consequence: AccusationConsequence;
}

/** Result of a GIVE_UP action. */
export interface GiveUpResult {
  /** Full narrative revealing the solution. */
  narrative: string;
}
