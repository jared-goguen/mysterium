/**
 * useMockGameState.ts — React hook for interactive mock game state
 *
 * Uses the Blue Parrot example mystery and provides the full game
 * interface with mock AI responses. Examine fuzzy-matches examinables,
 * sendMessage cycles through character knowledge arrays.
 */

import { useReducer, useCallback, useMemo, useEffect, useRef } from "react";
import blueParrot from "../../examples/blue-parrot";
import { createGameState } from "../../lib/initializers";
import { deriveEventLog } from "../../lib/events";
import type { EventEntry } from "../../lib/events";
import {
  discoveredClues,
  visitedLocationIds,
  interviewedCharacterIds,
  investigationProgress,
} from "../../types/state";
import type { GameState, Exploration, Conversation, Message } from "../../types/state";
import type { Mystery, Clue } from "../../types/mystery";

// ---------------------------------------------------------------------------
// Hook action types (UI-level, distinct from lib/actions.ts)
// ---------------------------------------------------------------------------

type HookAction =
  | { type: "START_GAME"; mystery: Mystery }
  | { type: "MOVE_TO"; locationId: string }
  | { type: "EXAMINE"; query: string; result: { narrative: string; clueFound: string | null } }
  | { type: "TALK_TO"; characterId: string }
  | { type: "SEND_MESSAGE"; characterId: string; message: string; response: string }
  | { type: "END_CONVERSATION"; characterId: string }
  | { type: "UPDATE_NOTES"; text: string };

// ---------------------------------------------------------------------------
// Extended state — adds notes to GameState
// ---------------------------------------------------------------------------

interface HookState {
  game: GameState | null;
  notes: string;
}

const STORAGE_KEY = "mysterium-state";

function loadPersistedState(): HookState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as HookState;
  } catch {
    // Corrupted or unavailable — start fresh
  }
  return null;
}

function persistState(state: HookState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // sessionStorage full or unavailable — silently ignore
  }
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function hookReducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case "START_GAME": {
      return {
        game: createGameState(action.mystery),
        notes: "",
      };
    }

    case "MOVE_TO": {
      if (!state.game) return state;
      const location = state.game.mystery.locations.find(
        (l) => l.id === action.locationId,
      );
      const exploration: Exploration = {
        locationId: action.locationId,
        query: `Moved to ${location?.name ?? action.locationId}`,
        clueFound: null,
        narrative: location?.description ?? "You arrive at a new location.",
        timestamp: Date.now(),
      };
      return {
        ...state,
        game: {
          ...state.game,
          focus: { type: "location", id: action.locationId },
          explorations: [...state.game.explorations, exploration],
        },
      };
    }

    case "EXAMINE": {
      if (!state.game) return state;
      const exploration: Exploration = {
        locationId: state.game.focus.type === "location" ? state.game.focus.id : "",
        query: action.query,
        clueFound: action.result.clueFound,
        narrative: action.result.narrative,
        timestamp: Date.now(),
      };
      return {
        ...state,
        game: {
          ...state.game,
          explorations: [...state.game.explorations, exploration],
        },
      };
    }

    case "TALK_TO": {
      if (!state.game) return state;
      const existing = state.game.conversations.find(
        (c) => c.characterId === action.characterId,
      );
      const conversations = existing
        ? state.game.conversations
        : [
            ...state.game.conversations,
            {
              characterId: action.characterId,
              messages: [],
              summaries: [],
              startedAt: Date.now(),
              lastMessageAt: Date.now(),
            } satisfies Conversation,
          ];
      return {
        ...state,
        game: {
          ...state.game,
          focus: { type: "character", id: action.characterId },
          conversations,
        },
      };
    }

    case "SEND_MESSAGE": {
      if (!state.game) return state;
      const now = Date.now();
      const playerMsg: Message = {
        role: "player",
        content: action.message,
        timestamp: now,
      };
      const npcMsg: Message = {
        role: "npc",
        content: action.response,
        timestamp: now + 1,
      };
      const conversations = state.game.conversations.map((c) => {
        if (c.characterId !== action.characterId) return c;
        return {
          ...c,
          messages: [...c.messages, playerMsg, npcMsg],
          lastMessageAt: now,
        };
      });
      return {
        ...state,
        game: { ...state.game, conversations },
      };
    }

    case "END_CONVERSATION": {
      if (!state.game) return state;
      // Find the character's location to return focus there
      const charLocation = state.game.mystery.locations.find((l) =>
        l.charactersPresent.includes(action.characterId),
      );
      const focusId = charLocation?.id ?? state.game.mystery.locations[0]?.id ?? "";
      return {
        ...state,
        game: {
          ...state.game,
          focus: { type: "location", id: focusId },
        },
      };
    }

    case "UPDATE_NOTES": {
      return { ...state, notes: action.text };
    }
  }
}

// ---------------------------------------------------------------------------
// Mock response helpers
// ---------------------------------------------------------------------------

/**
 * Cycle through an array of strings, returning the next one each call.
 * Uses a ref-based counter per character to track position.
 */
function buildMockResponse(
  character: { name: string; speechPattern: string },
  items: string[],
  index: number,
): string {
  if (items.length === 0) {
    return `${character.name} has nothing more to say.`;
  }
  const item = items[index % items.length]!;
  return item;
}

// ---------------------------------------------------------------------------
// Event log entry type (simplified for UI)
// ---------------------------------------------------------------------------

export interface LogEntry {
  type: "move" | "examine" | "clue" | "conversation" | "accusation";
  text: string;
  detail?: string;
  timestamp: number;
}

function buildEventLog(state: GameState): LogEntry[] {
  const entries: LogEntry[] = [];

  for (const exploration of state.explorations) {
    if (exploration.query.startsWith("Moved to ")) {
      entries.push({
        type: "move",
        text: exploration.query,
        timestamp: exploration.timestamp,
      });
    } else if (exploration.clueFound) {
      const clue = state.mystery.clues.find((c) => c.id === exploration.clueFound);
      entries.push({
        type: "clue",
        text: `Found: ${clue?.description ?? exploration.clueFound}`,
        detail: exploration.narrative,
        timestamp: exploration.timestamp,
      });
    } else {
      entries.push({
        type: "examine",
        text: `Examined: ${exploration.query}`,
        detail: exploration.narrative,
        timestamp: exploration.timestamp,
      });
    }
  }

  for (const conversation of state.conversations) {
    if (conversation.messages.length > 0) {
      const charName =
        state.mystery.characters.find((c) => c.id === conversation.characterId)?.name ??
        conversation.characterId;
      entries.push({
        type: "conversation",
        text: `Spoke with ${charName}`,
        detail: `${conversation.messages.length} messages`,
        timestamp: conversation.startedAt,
      });
    }
  }

  for (const accusation of state.accusations) {
    const suspectName =
      state.mystery.characters.find((c) => c.id === accusation.suspectId)?.name ??
      accusation.suspectId;
    entries.push({
      type: "accusation",
      text: `Accused ${suspectName} — ${accusation.outcome}`,
      detail: accusation.consequence.narrative,
      timestamp: accusation.timestamp,
    });
  }

  entries.sort((a, b) => a.timestamp - b.timestamp);
  return entries;
}

// ---------------------------------------------------------------------------
// Hook return type
// ---------------------------------------------------------------------------

export interface MockGameState {
  /** The full game state, or null if not started. */
  gameState: GameState | null;

  /** Whether a game is active. */
  isPlaying: boolean;

  /** Current mystery (null if not started). */
  mystery: Mystery | null;

  /** Player's notes. */
  notes: string;

  /** Chronological event log. */
  eventLog: LogEntry[];

  /** Derived: clues the player has found. */
  discoveredClues: Clue[];

  /** Derived: location IDs the player has visited. */
  visitedLocations: Set<string>;

  /** Derived: character IDs the player has talked to. */
  interviewedCharacters: Set<string>;

  /** Derived: 0–1 progress through evidence chain. */
  progress: number;

  // -- Actions --

  /** Start a new game with the Blue Parrot mystery. */
  startGame: () => void;

  /** Move to a location. */
  moveTo: (locationId: string) => void;

  /** Examine something at the current location. */
  examine: (query: string) => void;

  /** Start talking to a character. */
  talkTo: (characterId: string) => void;

  /** Send a message to the current character (mock response). */
  sendMessage: (characterId: string, message: string) => void;

  /** End the current conversation. */
  endConversation: () => void;

  /** Update player notes. */
  updateNotes: (text: string) => void;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useMockGameState(): MockGameState {
  const initialState: HookState = loadPersistedState() ?? {
    game: null,
    notes: "",
  };

  const [state, dispatch] = useReducer(hookReducer, initialState);

  // Track conversation response indices per character
  const responseCounters = useRef<Record<string, number>>({});

  // Persist on every state change
  useEffect(() => {
    persistState(state);
  }, [state]);

  // -- Actions --

  const startGame = useCallback(() => {
    responseCounters.current = {};
    dispatch({ type: "START_GAME", mystery: blueParrot });
  }, []);

  const moveTo = useCallback((locationId: string) => {
    dispatch({ type: "MOVE_TO", locationId });
  }, []);

  const examine = useCallback(
    (query: string) => {
      if (!state.game) return;
      const currentLocationId =
        state.game.focus.type === "location" ? state.game.focus.id : null;
      if (!currentLocationId) return;

      const location = state.game.mystery.locations.find(
        (l) => l.id === currentLocationId,
      );
      if (!location) return;

      // Fuzzy match: check if query.toLowerCase() contains the examinable's name
      const queryLower = query.toLowerCase();
      const matched = location.examinables.find((ex) =>
        queryLower.includes(ex.name.toLowerCase()),
      );

      if (matched) {
        dispatch({
          type: "EXAMINE",
          query,
          result: {
            narrative: matched.onExamine,
            clueFound: matched.clueId,
          },
        });
      } else {
        dispatch({
          type: "EXAMINE",
          query,
          result: {
            narrative: "You don't see anything like that here.",
            clueFound: null,
          },
        });
      }
    },
    [state.game],
  );

  const talkTo = useCallback((characterId: string) => {
    dispatch({ type: "TALK_TO", characterId });
  }, []);

  const sendMessage = useCallback(
    (characterId: string, message: string) => {
      if (!state.game) return;

      const character = state.game.mystery.characters.find(
        (c) => c.id === characterId,
      );
      if (!character) return;

      // Build the pool of responses: whatTheySaw, whatTheyKnow, whatTheySuspect
      const pool: string[] = [
        ...character.whatTheySaw,
        ...character.whatTheyKnow,
        character.whatTheySuspect,
      ];

      // Get and increment the counter for this character
      const counter = responseCounters.current[characterId] ?? 0;
      responseCounters.current[characterId] = counter + 1;

      const response = buildMockResponse(character, pool, counter);

      dispatch({
        type: "SEND_MESSAGE",
        characterId,
        message,
        response,
      });
    },
    [state.game],
  );

  const endConversation = useCallback(() => {
    if (!state.game || state.game.focus.type !== "character") return;
    dispatch({ type: "END_CONVERSATION", characterId: state.game.focus.id });
  }, [state.game]);

  const updateNotes = useCallback((text: string) => {
    dispatch({ type: "UPDATE_NOTES", text });
  }, []);

  // -- Derived state --

  const derived = useMemo(() => {
    if (!state.game) {
      return {
        discoveredClues: [] as Clue[],
        visitedLocations: new Set<string>(),
        interviewedCharacters: new Set<string>(),
        progress: 0,
        eventLog: [] as LogEntry[],
      };
    }
    return {
      discoveredClues: discoveredClues(state.game),
      visitedLocations: visitedLocationIds(state.game),
      interviewedCharacters: interviewedCharacterIds(state.game),
      progress: investigationProgress(state.game),
      eventLog: buildEventLog(state.game),
    };
  }, [state.game]);

  return {
    gameState: state.game,
    isPlaying: state.game?.phase === "playing",
    mystery: state.game?.mystery ?? null,
    notes: state.notes,
    eventLog: derived.eventLog,
    discoveredClues: derived.discoveredClues,
    visitedLocations: derived.visitedLocations,
    interviewedCharacters: derived.interviewedCharacters,
    progress: derived.progress,
    startGame,
    moveTo,
    examine,
    talkTo,
    sendMessage,
    endConversation,
    updateNotes,
  };
}
