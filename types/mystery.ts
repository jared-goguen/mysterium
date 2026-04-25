/**
 * mystery.ts — The Immutable World
 *
 * Generated once at game start. Never mutated.
 * This is ground truth: the complete specification of the crime,
 * the cast, the setting, and the solution.
 */

// ---------------------------------------------------------------------------
// Genre
// ---------------------------------------------------------------------------

export type Genre =
  | "noir"       // rain, shadows, jazz, cynicism
  | "gothic"     // candlelight, secrets, storms, portraits with watching eyes
  | "cozy"       // village, tea, gardens, eccentricity
  | "scifi"      // sterile corridors, holograms, corporate conspiracy
  | "historical" // period language, social hierarchy, propriety
  | "heist";     // the crime already happened — who double-crossed whom?

// ---------------------------------------------------------------------------
// Characters
// ---------------------------------------------------------------------------

/** What a character claims vs. what actually happened. */
export interface Alibi {
  /** What the character SAYS they were doing. */
  claimed: string;
  /** What they were ACTUALLY doing (may differ even for innocents). */
  truth: string;
  /** Time windows where their whereabouts are unaccounted for. */
  gaps: string[];
}

/** Every character has a secret — the reason innocents are evasive too. */
export interface Secret {
  /** What they're hiding. */
  description: string;
  /** Why they're hiding it — the personal stakes. */
  reason: string;
  /** What kind of pressure or evidence would make them reveal it. */
  revealTrigger: string;
}

export interface Character {
  id: string;
  name: string;
  /** Physical description + first impression. */
  description: string;
  /** How they interact: nervous, confident, sarcastic, maternal, etc. */
  personality: string;
  /** How they talk: formal, clipped, folksy, academic, etc. */
  speechPattern: string;

  // -- Crime-related --

  /** Why they MIGHT have done it. Everyone has a motive. */
  motive: string;
  alibi: Alibi;
  /** Could they have physically used the method? */
  meansAccess: boolean;
  /** When they were unaccounted for — their window. */
  opportunityWindow: string;

  // -- Knowledge --

  /** Things they witnessed firsthand. */
  whatTheySaw: string[];
  /** Things they know through hearsay or deduction. */
  whatTheyKnow: string[];
  /** Who they think did it and why — their personal theory. */
  whatTheySuspect: string;

  // -- Secret (even innocents have one) --
  secret: Secret;

  // -- Social --

  /** How they feel about each other character. keyed by character ID. */
  relationships: Record<string, string>;

  // -- Solution --
  isGuilty: boolean;
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

/** Something the player can examine at a location. */
export interface Examinable {
  id: string;
  /** What it is: "the mahogany desk", "the fireplace". */
  name: string;
  /** What you notice on first glance — a surface-level detail. */
  surfaceDetail: string;
  /** What you find when you examine it closely. */
  onExamine: string;
  /** If this object hides a clue, the clue's ID. Otherwise null. */
  clueId: string | null;
}

export interface Location {
  id: string;
  name: string;
  /** Rich atmospheric description — genre-appropriate. */
  description: string;
  /** Things the player can investigate here. */
  examinables: Examinable[];
  /** Which characters can be found at this location. */
  charactersPresent: string[];
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** A single event in the true sequence of what happened. */
export interface TimelineEvent {
  /** When it happened: "8:30 PM", "just before midnight". */
  time: string;
  /** What happened. */
  what: string;
  /** Character IDs involved. */
  who: string[];
  /** Location ID where it happened. */
  where: string;
  /** Character IDs who witnessed this event. */
  witnessedBy: string[];
  /** Why this matters to the mystery. */
  significance: string;
}

// ---------------------------------------------------------------------------
// Clues
// ---------------------------------------------------------------------------

export type ClueType =
  | "physical"     // a broken latch, a stained glove
  | "testimonial"  // something a character reveals
  | "documentary"  // a letter, a ledger entry, a photograph
  | "forensic";    // timing, cause of death, chemical residue

export interface Clue {
  id: string;
  /** What the clue IS — described as the player encounters it. */
  description: string;
  type: ClueType;

  // -- Discovery --

  /** Where it's found: a location ID (physical) or character ID (testimonial). */
  foundAt: string;
  /** How it's found: an examinable ID, or a conversation topic that elicits it. */
  foundVia: string;

  // -- Deductive value --

  /** Character IDs this clue rules out. */
  eliminates: string[];
  /** Character IDs this clue points toward. */
  implicates: string[];
  /** What fact this clue establishes: "the crime happened before 10 PM". */
  proves: string;

  // -- Chain position --

  /** Position in the evidence chain (1, 2, 3...). Core clues only. */
  chainPosition: number | null;
}

// ---------------------------------------------------------------------------
// Contradictions
// ---------------------------------------------------------------------------

/**
 * A pair of conflicting claims from two characters.
 * Contradictions are the engine of the mystery — catching them
 * and confronting suspects is the core gameplay loop.
 */
export interface Contradiction {
  id: string;
  characterA: string;
  claimA: string;
  characterB: string;
  claimB: string;
  /** What actually happened. */
  truth: string;
  /** Which clue ID resolves the contradiction. */
  resolvedByClue: string;
  /** What this contradiction reveals about the case. */
  significance: string;
}

// ---------------------------------------------------------------------------
// Red Herrings
// ---------------------------------------------------------------------------

export interface RedHerring {
  /** What it looks like — the misleading appearance. */
  description: string;
  /** The innocent explanation discoverable through investigation. */
  innocentExplanation: string;
}

// ---------------------------------------------------------------------------
// Solution — timeline-based
// ---------------------------------------------------------------------------

/** One link in the evidence chain that proves the solution. */
export interface EvidenceLink {
  /** Position in the chain: 1, 2, 3... */
  order: number;
  /** The clue ID. */
  clueId: string;
  /** What this clue proves in the chain. */
  whatItProves: string;
}

/** A category for solution questions / timeline moments. */
export type MomentCategory = "who" | "what" | "how" | "why" | "where" | "when";

/**
 * A single moment in the solution timeline.
 * Known moments provide context. Gaps are the puzzle the player fills in.
 */
export interface SolutionMoment {
  id: string;
  /** When this moment occurs: "10:40 PM". */
  time: string;
  /** True = shown to the player for context. False = the player must reconstruct. */
  isKnown: boolean;

  /** For known moments, the description shown to the player. */
  knownDescription?: string;
  /** For gaps, a prompt guiding what the player needs to figure out. */
  prompt?: string;

  /** The ground truth (hidden from the player until evaluated). */
  truth: {
    location: string;
    people: string[];
    description: string;
  };

  /** Clue IDs that help reconstruct this moment. */
  supportingClues: string[];

  /**
   * How important this moment is to the overall solution (0–1).
   * Weights across all gaps should sum to ~1.
   */
  weight: number;
}

export interface Solution {
  /** The full narrative truth — revealed on solve or give-up. */
  truth: string;

  /**
   * The timeline: known moments (context) + gaps (the puzzle).
   * Ordered chronologically.
   */
  moments: SolutionMoment[];

  /**
   * The ordered evidence chain.
   * If a player finds ALL clues in this chain, they can
   * logically reconstruct the full timeline.
   */
  evidenceChain: EvidenceLink[];
}

// ---------------------------------------------------------------------------
// Mystery — the top-level composite
// ---------------------------------------------------------------------------

export interface Mystery {
  /** Unique ID for this generated mystery. */
  id: string;

  /** Human-readable name: "Death at the Blue Parrot". */
  title: string;

  /** Who created it: "manual", "generated", or a player name. */
  author: string;

  /** Unix timestamp of when this mystery was created. */
  createdAt: number;

  /** Difficulty rating, 1 (straightforward) to 5 (devious). */
  difficulty: number;

  /** Spoiler-free teaser for the mystery listing. */
  description: string;

  genre: Genre;

  /** Setting: name, era, one-line atmosphere. */
  setting: {
    name: string;
    era: string;
    atmosphere: string;
  };

  /** What happened — the crime described in one paragraph. */
  crimeDescription: string;

  characters: Character[];
  locations: Location[];
  timeline: TimelineEvent[];
  clues: Clue[];
  contradictions: Contradiction[];
  redHerrings: RedHerring[];
  solution: Solution;
}
