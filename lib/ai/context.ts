/**
 * context.ts — Context slicers for prompt building
 *
 * Pure functions that select the relevant slice of mystery + state
 * for each AI engine. Keeps prompts focused and token-efficient.
 */

import type { Mystery, Character, Location, Clue } from "../../types/mystery";
import type { GameState, Conversation, NPCState } from "../../types/state";
import { discoveredClueIds, getConversation } from "../../types/state";

// ---------------------------------------------------------------------------
// Location context (for Examiner)
// ---------------------------------------------------------------------------

export interface LocationContext {
  location: Location;
  genre: string;
  atmosphere: string;
  /** Clue IDs already found at this location. */
  alreadyFoundHere: string[];
  /** Previous examination queries at this location. */
  previousQueries: string[];
}

export function locationContext(
  mystery: Mystery,
  state: GameState,
  locationId: string,
): LocationContext {
  const location = mystery.locations.find((l) => l.id === locationId);
  if (!location) throw new Error(`Unknown location: ${locationId}`);

  const found = discoveredClueIds(state);
  const locationClueIds = location.examinables
    .map((e) => e.clueId)
    .filter((id): id is string => id !== null);

  return {
    location,
    genre: mystery.genre,
    atmosphere: mystery.setting.atmosphere,
    alreadyFoundHere: locationClueIds.filter((id) => found.has(id)),
    previousQueries: state.explorations
      .filter((e) => e.locationId === locationId)
      .map((e) => e.query),
  };
}

// ---------------------------------------------------------------------------
// Character context (for Conversant)
// ---------------------------------------------------------------------------

export interface CharacterContext {
  character: Character;
  genre: string;
  atmosphere: string;
  npcState: NPCState;
  /** Compressed summaries from previous conversation visits. */
  previousSummaries: string[];
  /** Clue descriptions the player has found so far. */
  discoveredClueDescriptions: string[];
  /** Names of other suspects the player has talked to. */
  otherInterviewees: string[];
  /** Past theory attempt summaries. */
  theoryHistory: string[];
  /** Other character names + brief descriptions for relationship context. */
  otherCharacters: { id: string; name: string; brief: string }[];
  /** Testimonial clues this character could reveal (not yet discovered). */
  availableTestimonialClues: Clue[];
}

export function characterContext(
  mystery: Mystery,
  state: GameState,
  characterId: string,
): CharacterContext {
  const character = mystery.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`Unknown character: ${characterId}`);

  const npcState = state.npcStates[characterId];
  if (!npcState) throw new Error(`No NPC state for: ${characterId}`);

  const found = discoveredClueIds(state);
  const conversation = getConversation(state, characterId);

  // Testimonial clues this character can reveal (foundAt === characterId, not yet found)
  const availableTestimonialClues = mystery.clues.filter(
    (c) =>
      c.type === "testimonial" &&
      c.foundAt === characterId &&
      !found.has(c.id),
  );

  return {
    character,
    genre: mystery.genre,
    atmosphere: mystery.setting.atmosphere,
    npcState,
    previousSummaries: conversation
      ? conversation.summaries.map(
          (s) =>
            `Topics: ${s.topicsDiscussed.join(", ")}. Revealed: ${s.informationRevealed.join(", ")}. State after: ${s.emotionalStateAfter}.`,
        )
      : [],
    discoveredClueDescriptions: mystery.clues
      .filter((c) => found.has(c.id))
      .map((c) => c.description),
    otherInterviewees: state.conversations
      .filter((c) => c.characterId !== characterId)
      .map((c) => {
        const char = mystery.characters.find(
          (ch) => ch.id === c.characterId,
        );
        return char?.name ?? c.characterId;
      }),
    theoryHistory: state.theories.map(
      (t) =>
        `Theory attempt: ${t.outcome} (${Math.round(t.score * 100)}%)`,
    ),
    otherCharacters: mystery.characters
      .filter((c) => c.id !== characterId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        brief: c.description.split(".")[0] ?? c.description,
      })),
    availableTestimonialClues,
  };
}

// ---------------------------------------------------------------------------
// Conversation context (for Summarizer)
// ---------------------------------------------------------------------------

export interface ConversationContext {
  character: Character;
  conversation: Conversation;
  /** All character names + relationships to this character. */
  otherCharacters: { id: string; name: string; relationship: string }[];
  /** Known contradiction IDs involving this character. */
  relevantContradictions: string[];
}

export function conversationContext(
  mystery: Mystery,
  state: GameState,
  characterId: string,
): ConversationContext {
  const character = mystery.characters.find((c) => c.id === characterId);
  if (!character) throw new Error(`Unknown character: ${characterId}`);

  const conversation = getConversation(state, characterId);
  if (!conversation)
    throw new Error(`No conversation with: ${characterId}`);

  return {
    character,
    conversation,
    otherCharacters: mystery.characters
      .filter((c) => c.id !== characterId)
      .map((c) => ({
        id: c.id,
        name: c.name,
        relationship: character.relationships[c.id] ?? "no particular relationship",
      })),
    relevantContradictions: mystery.contradictions
      .filter(
        (ct) =>
          ct.characterA === characterId || ct.characterB === characterId,
      )
      .map((ct) => ct.id),
  };
}

// ---------------------------------------------------------------------------
// Solution context (for Judge — timeline evaluation)
// ---------------------------------------------------------------------------

export interface SolutionContext {
  solution: Mystery["solution"];
  genre: string;
  characters: { id: string; name: string; personality: string }[];
  /** How many failed theories so far. */
  priorFailures: number;
  /** Descriptions of all discovered clues. */
  discoveredClueDescriptions: string[];
}

export function solutionContext(
  mystery: Mystery,
  state: GameState,
): SolutionContext {
  const found = discoveredClueIds(state);

  return {
    solution: mystery.solution,
    genre: mystery.genre,
    characters: mystery.characters.map((c) => ({
      id: c.id,
      name: c.name,
      personality: c.personality,
    })),
    priorFailures: state.theories.filter((t) => t.outcome !== "solved")
      .length,
    discoveredClueDescriptions: mystery.clues
      .filter((c) => found.has(c.id))
      .map((c) => c.description),
  };
}
