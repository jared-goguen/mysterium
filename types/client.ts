/**
 * client.ts — Client-Safe Type System
 *
 * Stripped versions of Mystery types that exclude sensitive information
 * (guilt, secrets, alibis, solution truth, evidence chains, etc.).
 *
 * The client never sees the full Mystery — only ClientMystery.
 * Server-side code reconstructs the full Mystery from a registry
 * when AI engines need it.
 */

import type {
  Mystery,
  Genre,
  Character,
  Alibi,
  Examinable,
  Location,
  Clue,
  ClueType,
  Contradiction,
  RedHerring,
  SolutionMoment,
  Solution,
} from "./mystery";
import type {
  GameState,
  GamePhase,
  Exploration,
  Conversation,
  Theory,
  NPCState,
} from "./state";
import type { FocusTarget } from "./actions";

// ---------------------------------------------------------------------------
// Client-safe character
// ---------------------------------------------------------------------------

/** Alibi as seen by the client — only the claimed version. */
export interface ClientAlibi {
  claimed: string;
  gaps: string[];
}

/**
 * Character stripped of guilt, secrets, true alibi, and investigation knowledge.
 * Keeps: identity, personality, speech, role, interests, motive (public), claimed alibi, relationships.
 */
export interface ClientCharacter {
  id: string;
  name: string;
  description: string;
  personality: string;
  speechPattern: string;
  role: "suspect" | "narrator";
  interests: string[];
  dismissiveOf: string[];
  motive: string;
  alibi: ClientAlibi;
  relationships: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Client-safe examinable
// ---------------------------------------------------------------------------

/**
 * Examinable stripped of onExamine text and clueId.
 * The player sees what's there but doesn't know what examining it yields.
 * Prerequisite preserved so the client can compute available examinables.
 */
export interface ClientExaminable {
  id: string;
  name: string;
  surfaceDetail: string;
  prerequisite: string | null;
}

// ---------------------------------------------------------------------------
// Client-safe location
// ---------------------------------------------------------------------------

/** Location using ClientExaminable[]. Everything else preserved. */
export interface ClientLocation {
  id: string;
  name: string;
  description: string;
  examinables: ClientExaminable[];
  charactersPresent: string[];
}

// ---------------------------------------------------------------------------
// Client-safe clue
// ---------------------------------------------------------------------------

/**
 * Clue stripped of deductive value (eliminates, implicates, proves)
 * and evidence chain position. The player discovers clues incrementally
 * via API results — they don't need the full deductive graph.
 */
export interface ClientClue {
  id: string;
  description: string;
  type: ClueType;
  foundAt: string;
  foundVia: string;
}

// ---------------------------------------------------------------------------
// Client-safe contradiction
// ---------------------------------------------------------------------------

/** Contradiction stripped of the truth. Player must figure it out. */
export interface ClientContradiction {
  id: string;
  characterA: string;
  claimA: string;
  characterB: string;
  claimB: string;
  resolvedByClue: string;
  significance: string;
}

// ---------------------------------------------------------------------------
// Client-safe red herring
// ---------------------------------------------------------------------------

/** Red herring stripped of the innocent explanation. */
export interface ClientRedHerring {
  description: string;
}

// ---------------------------------------------------------------------------
// Client-safe solution
// ---------------------------------------------------------------------------

/**
 * Solution moment stripped of truth, supporting clues, and weight.
 * The player sees known descriptions and gap prompts — nothing else.
 */
export interface ClientSolutionMoment {
  id: string;
  time: string;
  isKnown: boolean;
  knownDescription?: string;
  prompt?: string;
}

/** Solution stripped of truth narrative and evidence chain. */
export interface ClientSolution {
  moments: ClientSolutionMoment[];
}

// ---------------------------------------------------------------------------
// ClientMystery — the top-level composite
// ---------------------------------------------------------------------------

export interface ClientMystery {
  id: string;
  title: string;
  author: string;
  createdAt: number;
  difficulty: number;
  description: string;
  genre: Genre;
  setting: {
    name: string;
    era: string;
    atmosphere: string;
  };
  crimeDescription: string;
  characters: ClientCharacter[];
  locations: ClientLocation[];
  clues: ClientClue[];
  contradictions: ClientContradiction[];
  redHerrings: ClientRedHerring[];
  solution: ClientSolution;

  /**
   * Total number of clues in the mystery.
   * Allows the client to compute investigationProgress
   * without needing the full (server-side) clue details.
   */
  totalClueCount: number;
}

// ---------------------------------------------------------------------------
// ClientGameState
// ---------------------------------------------------------------------------

/** GameState using ClientMystery instead of full Mystery. */
export interface ClientGameState {
  mystery: ClientMystery;
  phase: GamePhase;
  explorations: Exploration[];
  conversations: Conversation[];
  theories: Theory[];
  npcStates: Record<string, NPCState>;
  focus: FocusTarget;
  startedAt: number;
}

// ---------------------------------------------------------------------------
// Mystery list item (catalog)
// ---------------------------------------------------------------------------

/** Minimal metadata for mystery selection UI. */
export interface MysteryListItem {
  id: string;
  title: string;
  genre: Genre;
  difficulty: number;
  description: string;
  setting: {
    name: string;
    era: string;
    atmosphere: string;
  };
}

// ---------------------------------------------------------------------------
// Strip functions
// ---------------------------------------------------------------------------

function stripCharacter(c: Character): ClientCharacter {
  return {
    id: c.id,
    name: c.name,
    description: c.description,
    personality: c.personality,
    speechPattern: c.speechPattern,
    role: c.role,
    interests: c.interests,
    dismissiveOf: c.dismissiveOf,
    motive: c.motive,
    alibi: {
      claimed: c.alibi.claimed,
      gaps: c.alibi.gaps,
    },
    relationships: c.relationships,
  };
}

function stripExaminable(e: Examinable): ClientExaminable {
  return {
    id: e.id,
    name: e.name,
    surfaceDetail: e.surfaceDetail,
    prerequisite: e.prerequisite,
  };
}

function stripLocation(l: Location): ClientLocation {
  return {
    id: l.id,
    name: l.name,
    description: l.description,
    examinables: l.examinables.map(stripExaminable),
    charactersPresent: l.charactersPresent,
  };
}

function stripClue(c: Clue): ClientClue {
  return {
    id: c.id,
    description: c.description,
    type: c.type,
    foundAt: c.foundAt,
    foundVia: c.foundVia,
  };
}

function stripContradiction(c: Contradiction): ClientContradiction {
  return {
    id: c.id,
    characterA: c.characterA,
    claimA: c.claimA,
    characterB: c.characterB,
    claimB: c.claimB,
    resolvedByClue: c.resolvedByClue,
    significance: c.significance,
  };
}

function stripRedHerring(r: RedHerring): ClientRedHerring {
  return {
    description: r.description,
  };
}

function stripSolutionMoment(m: SolutionMoment): ClientSolutionMoment {
  return {
    id: m.id,
    time: m.time,
    isKnown: m.isKnown,
    ...(m.knownDescription !== undefined && {
      knownDescription: m.knownDescription,
    }),
    ...(m.prompt !== undefined && { prompt: m.prompt }),
  };
}

function stripSolution(s: Solution): ClientSolution {
  return {
    moments: s.moments.map(stripSolutionMoment),
  };
}

/** Strip a Mystery down to a minimal catalog item. */
export function stripToListItem(mystery: Mystery): MysteryListItem {
  return {
    id: mystery.id,
    title: mystery.title,
    genre: mystery.genre,
    difficulty: mystery.difficulty,
    description: mystery.description,
    setting: { ...mystery.setting },
  };
}

/** Strip a full Mystery down to its client-safe version. */
export function stripMystery(mystery: Mystery): ClientMystery {
  return {
    id: mystery.id,
    title: mystery.title,
    author: mystery.author,
    createdAt: mystery.createdAt,
    difficulty: mystery.difficulty,
    description: mystery.description,
    genre: mystery.genre,
    setting: { ...mystery.setting },
    crimeDescription: mystery.crimeDescription,
    characters: mystery.characters.map(stripCharacter),
    locations: mystery.locations.map(stripLocation),
    clues: mystery.clues.map(stripClue),
    contradictions: mystery.contradictions.map(stripContradiction),
    redHerrings: mystery.redHerrings.map(stripRedHerring),
    solution: stripSolution(mystery.solution),
    totalClueCount: mystery.clues.length,
  };
}

/** Strip a full GameState down to its client-safe version. */
export function stripGameState(state: GameState): ClientGameState {
  return {
    mystery: stripMystery(state.mystery),
    phase: state.phase,
    explorations: state.explorations,
    conversations: state.conversations,
    theories: state.theories,
    npcStates: state.npcStates,
    focus: state.focus,
    startedAt: state.startedAt,
  };
}

/**
 * Reconstruct a full GameState from a ClientGameState and the full Mystery.
 * Used server-side: the client sends ClientGameState (no sensitive data),
 * the server looks up the full Mystery from the registry, and combines them.
 */
export function reconstructGameState(
  clientState: ClientGameState,
  mystery: Mystery,
): GameState {
  return {
    mystery,
    phase: clientState.phase,
    explorations: clientState.explorations,
    conversations: clientState.conversations,
    theories: clientState.theories,
    npcStates: clientState.npcStates,
    focus: clientState.focus,
    startedAt: clientState.startedAt,
  };
}

// ---------------------------------------------------------------------------
// Client-side derived state functions
// ---------------------------------------------------------------------------

/** Compute the set of clue IDs the player has discovered (client-side). */
export function clientDiscoveredClueIds(state: ClientGameState): Set<string> {
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

/** Resolve discovered clue IDs to ClientClue objects. */
export function clientDiscoveredClues(state: ClientGameState): ClientClue[] {
  const ids = clientDiscoveredClueIds(state);
  return state.mystery.clues.filter((c) => ids.has(c.id));
}

/** 0–1 progress through the evidence chain (client-side). */
export function clientInvestigationProgress(state: ClientGameState): number {
  const total = state.mystery.totalClueCount;
  if (total === 0) return 0;
  return clientDiscoveredClueIds(state).size / total;
}

/** Set of location IDs the player has visited (client-side). */
export function clientVisitedLocationIds(state: ClientGameState): Set<string> {
  return new Set(state.explorations.map((e) => e.locationId));
}

/** Set of character IDs the player has talked to (client-side). */
export function clientInterviewedCharacterIds(state: ClientGameState): Set<string> {
  return new Set(state.conversations.map((c) => c.characterId));
}

/** Get the conversation for a specific character (client-side). */
export function clientGetConversation(
  state: ClientGameState,
  characterId: string,
): ClientGameState["conversations"][number] | undefined {
  return state.conversations.find((c) => c.characterId === characterId);
}

/**
 * Set of examinable IDs the player has successfully matched at a location.
 * Used to determine which prerequisite-gated examinables are available.
 */
export function clientExaminedExaminableIds(
  state: ClientGameState,
  locationId: string,
): Set<string> {
  return new Set(
    state.explorations
      .filter((e) => e.locationId === locationId && e.examinableId !== null)
      .map((e) => e.examinableId!),
  );
}

/**
 * Available examinables at a location, filtered by prerequisite completion.
 * An examinable is available if it has no prerequisite, or its prerequisite
 * has been examined (matched) by the player.
 */
export function clientAvailableExaminables(
  state: ClientGameState,
  locationId: string,
): ClientExaminable[] {
  const location = state.mystery.locations.find((l) => l.id === locationId);
  if (!location) return [];

  const examined = clientExaminedExaminableIds(state, locationId);
  return location.examinables.filter(
    (e) => e.prerequisite === null || examined.has(e.prerequisite),
  );
}
