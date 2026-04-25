/**
 * useGameState.ts — Real game state hook backed by AI engines
 *
 * Same interface as useMockGameState so components don't change.
 * Calls API routes → AI engines → applies results through the reducer.
 * Handles SSE streaming for NPC chat.
 */

import { useReducer, useCallback, useMemo, useEffect, useState } from "react";
import blueParrot from "../../examples/blue-parrot";
import { createGameState } from "../../lib/initializers";
import {
  applyMove,
  applyExamine,
  applyTalk,
  applySay,
  applyEndConversation,
  applyAccuse,
  applyGiveUp,
} from "../../lib/reducer";
import {
  discoveredClues,
  visitedLocationIds,
  interviewedCharacterIds,
  investigationProgress,
} from "../../types/state";
import { deriveEventLog } from "../../lib/events";
import type { EventEntry } from "../../lib/events";
import type { GameState } from "../../types/state";
import type { Mystery, Clue } from "../../types/mystery";
import type {
  ExamineResult,
  SayResult,
  EndConversationResult,
  AccuseResult,
} from "../../types/actions";

// ---------------------------------------------------------------------------
// State shape — wraps GameState with UI-level concerns
// ---------------------------------------------------------------------------

interface HookState {
  game: GameState | null;
  notes: string;
  /** Text currently streaming from an NPC. Null when not streaming. */
  streamingText: string | null;
  /** Whether an API call is in flight. */
  loading: boolean;
  /** Last error message, if any. */
  error: string | null;
  /** Player message shown optimistically before API confirms. */
  pendingMessage: string | null;
}

type HookAction =
  | { type: "START_GAME"; mystery: Mystery }
  | { type: "SET_GAME"; game: GameState }
  | { type: "UPDATE_NOTES"; text: string }
  | { type: "SET_STREAMING"; text: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PENDING_MESSAGE"; message: string | null };

function hookReducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case "START_GAME":
      return { game: createGameState(action.mystery), notes: "", streamingText: null, loading: false, error: null, pendingMessage: null };
    case "SET_GAME":
      return { ...state, game: action.game, error: null, pendingMessage: null };
    case "UPDATE_NOTES":
      return { ...state, notes: action.text };
    case "SET_STREAMING":
      return { ...state, streamingText: action.text };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false, pendingMessage: null };
    case "SET_PENDING_MESSAGE":
      return { ...state, pendingMessage: action.message };
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

const STORAGE_KEY = "mysterium-state";

function loadPersistedState(): HookState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { game: GameState | null; notes: string };
      return { game: parsed.game, notes: parsed.notes, streamingText: null, loading: false, error: null, pendingMessage: null };
    }
  } catch { /* start fresh */ }
  return null;
}

function persistState(state: HookState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ game: state.game, notes: state.notes }));
  } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiPost<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error ?? `API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Return type — matches MockGameState interface
// ---------------------------------------------------------------------------

export interface GameStateHook {
  gameState: GameState | null;
  isPlaying: boolean;
  mystery: Mystery | null;
  notes: string;
  eventLog: EventEntry[];
  discoveredClues: Clue[];
  visitedLocations: Set<string>;
  interviewedCharacters: Set<string>;
  progress: number;
  /** Text currently streaming from NPC. Null when idle. */
  streamingText: string | null;
  /** Whether an API call is in flight. */
  loading: boolean;
  /** Last error message. */
  error: string | null;
  /** Player message shown optimistically before API confirms. */
  pendingMessage: string | null;

  startGame: () => void;
  moveTo: (locationId: string) => void;
  examine: (query: string) => void;
  talkTo: (characterId: string) => void;
  sendMessage: (characterId: string, message: string) => void;
  endConversation: () => void;
  accuse: (suspectId: string, motive: string, method: string, evidenceCited: string[]) => void;
  giveUp: () => void;
  updateNotes: (text: string) => void;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useGameState(): GameStateHook {
  const initial: HookState = loadPersistedState() ?? {
    game: null, notes: "", streamingText: null, loading: false, error: null, pendingMessage: null,
  };

  const [state, dispatch] = useReducer(hookReducer, initial);

  // Persist on game/notes changes
  useEffect(() => { persistState(state); }, [state.game, state.notes]);

  // -- Synchronous actions --

  const startGame = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "START_GAME", mystery: blueParrot });
  }, []);

  const moveTo = useCallback((locationId: string) => {
    if (!state.game) return;
    dispatch({ type: "SET_GAME", game: applyMove(state.game, { type: "MOVE", locationId }) });
  }, [state.game]);

  const talkTo = useCallback((characterId: string) => {
    if (!state.game) return;
    dispatch({ type: "SET_GAME", game: applyTalk(state.game, { type: "TALK", characterId }) });
  }, [state.game]);

  const updateNotes = useCallback((text: string) => {
    dispatch({ type: "UPDATE_NOTES", text });
  }, []);

  // -- Async actions (call API routes) --

  const examine = useCallback((query: string) => {
    if (!state.game || state.game.focus.type !== "location") return;
    const locationId = state.game.focus.id;
    const gameState = state.game;

    dispatch({ type: "SET_LOADING", loading: true });

    apiPost<ExamineResult>("/api/examine", { gameState, locationId, query })
      .then((result) => {
        const next = applyExamine(gameState, { type: "EXAMINE", locationId, query }, result);
        dispatch({ type: "SET_GAME", game: next });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", error: err.message });
      });
  }, [state.game]);

  const sendMessage = useCallback((characterId: string, message: string) => {
    if (!state.game || state.game.focus.type !== "character") return;
    const gameState = state.game;

    dispatch({ type: "SET_PENDING_MESSAGE", message });
    dispatch({ type: "SET_LOADING", loading: true });
    dispatch({ type: "SET_STREAMING", text: "" });

    // Open SSE stream to /api/chat
    fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameState, characterId, message }),
    })
      .then(async (res) => {
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
          throw new Error(err.error ?? `API error: ${res.status}`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let cluesRevealed: string[] = [];
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // Keep incomplete last line

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              if (eventType === "delta") {
                fullText += data.text;
                dispatch({ type: "SET_STREAMING", text: fullText });
              } else if (eventType === "done") {
                fullText = data.response;
                cluesRevealed = data.cluesRevealed ?? [];
              } else if (eventType === "error") {
                throw new Error(data.message);
              }
            }
          }
        }

        // Apply the complete result to state
        const result: SayResult = { response: fullText, cluesRevealed };
        const next = applySay(gameState, { type: "SAY", characterId, message }, result);
        dispatch({ type: "SET_GAME", game: next });
        dispatch({ type: "SET_STREAMING", text: null });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_STREAMING", text: null });
        dispatch({ type: "SET_ERROR", error: err.message });
      });
  }, [state.game]);

  const endConversation = useCallback(() => {
    if (!state.game || state.game.focus.type !== "character") return;
    const characterId = state.game.focus.id;
    const gameState = state.game;

    dispatch({ type: "SET_LOADING", loading: true });

    apiPost<EndConversationResult>("/api/summarize", { gameState, characterId })
      .then((result) => {
        const next = applyEndConversation(
          gameState,
          { type: "END_CONVERSATION", characterId },
          result,
        );
        dispatch({ type: "SET_GAME", game: next });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", error: err.message });
      });
  }, [state.game]);

  const accuse = useCallback(
    (suspectId: string, motive: string, method: string, evidenceCited: string[]) => {
      if (!state.game) return;
      const gameState = state.game;

      dispatch({ type: "SET_LOADING", loading: true });

      apiPost<AccuseResult>("/api/accuse", {
        gameState, suspectId, motive, method, evidenceCited,
      })
        .then((result) => {
          const next = applyAccuse(
            gameState,
            { type: "ACCUSE", suspectId, motive, method, evidenceCited },
            result,
          );
          dispatch({ type: "SET_GAME", game: next });
          dispatch({ type: "SET_LOADING", loading: false });
        })
        .catch((err) => {
          dispatch({ type: "SET_ERROR", error: err.message });
        });
    },
    [state.game],
  );

  const doGiveUp = useCallback(() => {
    if (!state.game) return;
    const gameState = state.game;

    dispatch({ type: "SET_LOADING", loading: true });

    apiPost<{ narrative: string }>("/api/give-up", { gameState })
      .then((result) => {
        const next = applyGiveUp(gameState, { type: "GIVE_UP" }, result);
        dispatch({ type: "SET_GAME", game: next });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_ERROR", error: err.message });
      });
  }, [state.game]);

  // -- Derived state --

  const derived = useMemo(() => {
    if (!state.game) {
      return {
        discoveredClues: [] as Clue[],
        visitedLocations: new Set<string>(),
        interviewedCharacters: new Set<string>(),
        progress: 0,
        eventLog: [] as EventEntry[],
      };
    }
    return {
      discoveredClues: discoveredClues(state.game),
      visitedLocations: visitedLocationIds(state.game),
      interviewedCharacters: interviewedCharacterIds(state.game),
      progress: investigationProgress(state.game),
      eventLog: deriveEventLog(state.game),
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
    streamingText: state.streamingText,
    loading: state.loading,
    error: state.error,
    pendingMessage: state.pendingMessage,
    startGame,
    moveTo,
    examine,
    talkTo,
    sendMessage,
    endConversation,
    accuse,
    giveUp: doGiveUp,
    updateNotes,
  };
}
