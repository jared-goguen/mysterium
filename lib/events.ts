/**
 * events.ts — Derive a human-readable event log from state
 */

import type { GameState } from "../types/state";

export type EventType =
  | "move"
  | "examine"
  | "examine_clue"
  | "talk"
  | "end_conversation"
  | "theory_solved"
  | "theory_close"
  | "theory_wrong"
  | "give_up";

export interface EventEntry {
  timestamp: number;
  type: EventType;
  description: string;
  icon: string;
  entityId?: string;
}

function locationName(state: GameState, id: string): string {
  return state.mystery.locations.find((l) => l.id === id)?.name ?? id;
}

function characterName(state: GameState, id: string): string {
  return state.mystery.characters.find((c) => c.id === id)?.name ?? id;
}

function clueDescription(state: GameState, id: string): string {
  const clue = state.mystery.clues.find((c) => c.id === id);
  if (!clue) return id;
  const first = clue.description.split(". ")[0];
  return first && first.length <= 80 ? first : clue.description.slice(0, 77) + "...";
}

export function deriveEventLog(state: GameState): EventEntry[] {
  const entries: EventEntry[] = [];

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

  for (const conversation of state.conversations) {
    entries.push({
      timestamp: conversation.startedAt,
      type: "talk",
      description: `Talked to ${characterName(state, conversation.characterId)}`,
      icon: "💬",
      entityId: conversation.characterId,
    });

    for (const summary of conversation.summaries) {
      const clueCount = summary.cluesDiscovered.length;
      const clueNote =
        clueCount > 0
          ? ` — ${clueCount} clue${clueCount > 1 ? "s" : ""} revealed`
          : "";
      entries.push({
        timestamp: conversation.lastMessageAt,
        type: "end_conversation",
        description: `Finished talking to ${characterName(state, conversation.characterId)}${clueNote}`,
        icon: "📝",
        entityId: conversation.characterId,
      });
    }
  }

  for (const theory of state.theories) {
    const scorePercent = Math.round(theory.score * 100);
    switch (theory.outcome) {
      case "solved":
        entries.push({
          timestamp: theory.timestamp,
          type: "theory_solved",
          description: `Mystery solved! (${scorePercent}%)`,
          icon: "✅",
        });
        break;
      case "close":
        entries.push({
          timestamp: theory.timestamp,
          type: "theory_close",
          description: `Theory presented — close but not quite (${scorePercent}%)`,
          icon: "🟡",
        });
        break;
      case "wrong":
        entries.push({
          timestamp: theory.timestamp,
          type: "theory_wrong",
          description: `Theory presented — off the mark (${scorePercent}%)`,
          icon: "❌",
        });
        break;
    }
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  return entries;
}
