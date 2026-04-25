/**
 * tools.ts — Tool schemas for all engines
 *
 * Each tool defines the structured JSON shape that Claude fills in.
 * These are Anthropic tool definitions (JSON Schema format).
 */

import type { Tool } from "./client";

/** Examiner: narrate what the player finds when examining something. */
export const EXAMINE_TOOL: Tool = {
  name: "examine_location",
  description:
    "Report what the player finds when examining something at a location.",
  input_schema: {
    type: "object" as const,
    properties: {
      narrative: {
        type: "string",
        description:
          "Atmospheric 2-3 paragraph description of what the player finds. Genre-appropriate.",
      },
      clueFound: {
        type: ["string", "null"],
        description:
          "The clue ID if an undiscovered clue was found, or null if nothing clue-worthy was found.",
      },
      matchedExaminable: {
        type: ["string", "null"],
        description:
          "The examinable ID that the player's query matched, or null if no match.",
      },
    },
    required: ["narrative", "clueFound", "matchedExaminable"],
  },
};

/** Clue Detector: check if an NPC's response revealed any testimonial clues. */
export const DETECT_CLUES_TOOL: Tool = {
  name: "detect_clues",
  description:
    "Identify which testimonial clues, if any, were revealed in the NPC's response.",
  input_schema: {
    type: "object" as const,
    properties: {
      cluesRevealed: {
        type: "array",
        items: { type: "string" },
        description:
          "Array of clue IDs that were revealed in the response. Empty array if none.",
      },
    },
    required: ["cluesRevealed"],
  },
};

/** Summarizer: extract structured summary from a conversation. */
export const SUMMARIZE_TOOL: Tool = {
  name: "summarize_conversation",
  description:
    "Analyze a conversation and extract a structured summary including topics, revelations, emotional state, and information spread.",
  input_schema: {
    type: "object" as const,
    properties: {
      topicsDiscussed: {
        type: "array",
        items: { type: "string" },
        description: "Main topics covered in the conversation.",
      },
      informationRevealed: {
        type: "array",
        items: { type: "string" },
        description: "New facts the NPC shared with the investigator.",
      },
      emotionalStateAfter: {
        type: "string",
        description:
          "The NPC's emotional state after this conversation (e.g. 'nervous', 'hostile', 'relieved').",
      },
      contradictionsExposed: {
        type: "array",
        items: { type: "string" },
        description:
          "Contradiction IDs that were surfaced during the conversation. Empty array if none.",
      },
      cluesDiscovered: {
        type: "array",
        items: { type: "string" },
        description:
          "Testimonial clue IDs revealed during the conversation. Empty array if none.",
      },
      informationSpread: {
        type: "object",
        additionalProperties: {
          type: "array",
          items: { type: "string" },
        },
        description:
          "Map of characterId → what they would realistically hear about from this conversation, based on relationships.",
      },
      npcStateUpdates: {
        type: "object",
        additionalProperties: { type: "string" },
        description:
          "Map of characterId → new emotional state for NPCs affected by information spread.",
      },
    },
    required: [
      "topicsDiscussed",
      "informationRevealed",
      "emotionalStateAfter",
      "contradictionsExposed",
      "cluesDiscovered",
      "informationSpread",
      "npcStateUpdates",
    ],
  },
};

/** Judge: evaluate a player's accusation against the ground truth. */
export const EVALUATE_ACCUSATION_TOOL: Tool = {
  name: "evaluate_accusation",
  description:
    "Evaluate the player's accusation against the ground truth and generate dramatic consequences.",
  input_schema: {
    type: "object" as const,
    properties: {
      outcome: {
        type: "string",
        enum: ["correct", "partial", "wrong"],
        description:
          "correct = right suspect + substantially right theory. partial = right suspect, wrong theory. wrong = wrong suspect.",
      },
      narrative: {
        type: "string",
        description:
          "Dramatic narrative of the consequence. 2-4 paragraphs, genre-appropriate.",
      },
      npcStateChanges: {
        type: "object",
        additionalProperties: { type: "string" },
        description:
          "Map of characterId → new emotional state after the accusation.",
      },
      secretsRevealed: {
        type: "array",
        items: { type: "string" },
        description:
          "Character IDs whose secrets were revealed as a consequence of this accusation.",
      },
      gameOver: {
        type: "boolean",
        description: "True only if the accusation was correct.",
      },
    },
    required: [
      "outcome",
      "narrative",
      "npcStateChanges",
      "secretsRevealed",
      "gameOver",
    ],
  },
};

/** Give Up: reveal the full solution as a narrative epilogue. */
export const GIVE_UP_TOOL: Tool = {
  name: "reveal_solution",
  description:
    "Generate a narrative epilogue revealing the full solution to the mystery.",
  input_schema: {
    type: "object" as const,
    properties: {
      narrative: {
        type: "string",
        description:
          "Full narrative revealing the solution: who did it, how, why, and what every suspect was really hiding. 4-6 paragraphs, genre-appropriate.",
      },
    },
    required: ["narrative"],
  },
};
