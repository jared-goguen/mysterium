/**
 * events.ts — Derive a human-readable event log from state
 *
 * The event log is the left panel in the UI. It's a chronological
 * list of everything that happened, derived from the three append-only
 * logs in GameState. Pure function — no side effects.
 */

import type { GameState } from "../types/state";

export type EventType =
  | "move"
  | "examine"
  | "examine_clue"
  | "talk"
  | "end_conversation"
  | "accuse_correct"
  | "accuse_partial"
  | "accuse_wrong"
  | "give_up";

export interface EventEntry {
  timestamp: number;
  type: EventType;
  /** Short description for the event log. */
  description: string;
  /** Icon/emoji for visual distinction. */
  icon: string;
  /** Optional: related entity ID (location, character, clue). */
  entityId?: string;
}

/** Helper: resolve a location ID to its name. */
function locationName(state: GameState, id: string): string {
  return (
    state.mystery.locations.find((l) => l.id === id)?.name ?? id
  );
}

/** Helper: resolve a character ID to their name. */
function characterName(state: GameState, id: string): string {
  return (
    state.mystery.characters.find((c) => c.id === id)?.name ?? id
  );
}

/** Helper: resolve a clue ID to its short description. */
function clueDescription(state: GameState, id: string): string {
  const clue = state.mystery.clues.find((c) => c.id === id);
  if (!clue) return id;
  // Truncate to first sentence or 80 chars
  const firstSentence = clue.description.split(". ")[0];
  return firstSentence && firstSentence.length <= 80
    ? firstSentence
    : clue.description.slice(0, 77) + "...";
}

/**
 * Derive a chronological event log from the game state.
 * Merges all three logs, sorted by timestamp.
 */
export function deriveEventLog(state: GameState): EventEntry[] {
  const entries: EventEntry[] = [];

  // Explorations → examine events
  for (const exploration of state.explorations) {
    if (exploration.clueFound) {
      entries.push({
        timestamp: exploration.timestamp,
        type: "examine_clue",
        description: `Examined ${exploration.query} — found: ${clueDescription(state, exploration.clueFound)}`,
        icon: "🔍",
        entityId: exploration.clueFound,
      });
    } else {
      entries.push({
        timestamp: exploration.timestamp,
        type: "examine",
        description: `Examined ${exploration.query} at ${locationName(state, exploration.locationId)}`,
        icon: "👁",
        entityId: exploration.locationId,
      });
    }
  }

  // Conversations → talk + end_conversation events
  for (const conversation of state.conversations) {
    entries.push({
      timestamp: conversation.startedAt,
      type: "talk",
      description: `Talked to ${characterName(state, conversation.characterId)}`,
      icon: "💬",
      entityId: conversation.characterId,
    });

    // Each summary = end of a conversation visit
    for (const summary of conversation.summaries) {
      const clueCount = summary.cluesDiscovered.length;
      const clueNote =
        clueCount > 0 ? ` — ${clueCount} clue${clueCount > 1 ? "s" : ""} revealed` : "";
      entries.push({
        // Summaries don't have their own timestamp — approximate from the conversation
        timestamp: conversation.lastMessageAt,
        type: "end_conversation",
        description: `Finished talking to ${characterName(state, conversation.characterId)}${clueNote}`,
        icon: "📝",
        entityId: conversation.characterId,
      });
    }
  }

  // Accusations
  for (const accusation of state.accusations) {
    const suspectName = characterName(state, accusation.suspectId);
    switch (accusation.outcome) {
      case "correct":
        entries.push({
          timestamp: accusation.timestamp,
          type: "accuse_correct",
          description: `Accused ${suspectName} — case solved!`,
          icon: "✅",
          entityId: accusation.suspectId,
        });
        break;
      case "partial":
        entries.push({
          timestamp: accusation.timestamp,
          type: "accuse_partial",
          description: `Accused ${suspectName} — right suspect, wrong theory`,
          icon: "🟡",
          entityId: accusation.suspectId,
        });
        break;
      case "wrong":
        entries.push({
          timestamp: accusation.timestamp,
          type: "accuse_wrong",
          description: `Accused ${suspectName} — wrong`,
          icon: "❌",
          entityId: accusation.suspectId,
        });
        break;
    }
  }

  // Sort chronologically
  entries.sort((a, b) => a.timestamp - b.timestamp);

  return entries;
}
