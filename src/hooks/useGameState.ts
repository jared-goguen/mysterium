/**
 * useGameState.ts — Real game state hook backed by AI engines
 *
 * Four actions: focus, interact, solve, giveUp.
 * FOCUS auto-summarizes when leaving a character.
 * INTERACT dispatches to /api/examine or /api/chat based on focus context.
 *
 * Client stores ClientGameState (no sensitive mystery data).
 * API calls send mysteryId + client state; server reconstructs full state.
 */

import { useReducer, useCallback, useMemo, useEffect } from "react";
import {
  applyFocus,
  applyInteract,
  applySolve,
  applyGiveUp,
} from "../../lib/reducer";
import { deriveEventLog } from "../../lib/events";
import type { EventEntry } from "../../lib/events";
import type { GameState } from "../../types/state";
import type {
  ClientGameState,
  ClientMystery,
  ClientClue,
} from "../../types/client";
import {
  clientDiscoveredClues,
  clientVisitedLocationIds,
  clientInterviewedCharacterIds,
  clientInvestigationProgress,
  clientGetConversation,
} from "../../types/client";
import type {
  FocusResult,
  ExamineInteractResult,
  SpeakInteractResult,
  SolveResult,
  FocusTarget,
} from "../../types/actions";

// ---------------------------------------------------------------------------
// Hook state
// ---------------------------------------------------------------------------

interface HookState {
  game: ClientGameState | null;
  notes: string;
  streamingText: string | null;
  loading: boolean;
  error: string | null;
}

type HookAction =
  | { type: "SET_GAME"; game: ClientGameState }
  | { type: "UPDATE_NOTES"; text: string }
  | { type: "SET_STREAMING"; text: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null };

function hookReducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case "SET_GAME":
      return { ...state, game: action.game, error: null };
    case "UPDATE_NOTES":
      return { ...state, notes: action.text };
    case "SET_STREAMING":
      return { ...state, streamingText: action.text };
    case "SET_LOADING":
      return { ...state, loading: action.loading };
    case "SET_ERROR":
      return { ...state, error: action.error, loading: false };
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
      const parsed = JSON.parse(raw) as { game: ClientGameState | null; notes: string };
      return { game: parsed.game, notes: parsed.notes, streamingText: null, loading: false, error: null };
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

/**
 * Build the API request body for game routes.
 * Sends mysteryId + full client state (server extracts what it needs).
 */
function apiBody(game: ClientGameState, extra?: Record<string, unknown>) {
  return { mysteryId: game.mystery.id, state: game, ...extra };
}

/**
 * Cast ClientGameState to GameState for the pure reducer functions.
 *
 * Safe because the reducer apply* functions never access state.mystery —
 * they only touch mutable fields (explorations, conversations, theories,
 * npcStates, focus, phase). The mystery field passes through unchanged.
 */
function asGameState(client: ClientGameState): GameState {
  return client as unknown as GameState;
}

/** Cast reducer output back to ClientGameState. */
function asClientState(game: GameState): ClientGameState {
  return game as unknown as ClientGameState;
}

// ---------------------------------------------------------------------------
// Return type
// ---------------------------------------------------------------------------

export interface GameStateHook {
  gameState: ClientGameState | null;
  isPlaying: boolean;
  mystery: ClientMystery | null;
  notes: string;
  eventLog: EventEntry[];
  discoveredClues: ClientClue[];
  visitedLocations: Set<string>;
  interviewedCharacters: Set<string>;
  progress: number;
  streamingText: string | null;
  loading: boolean;
  error: string | null;

  startGame: (mysteryId: string) => void;
  focus: (target: FocusTarget) => void;
  interact: (message: string) => void;
  solve: (answers: Record<string, string>, evidenceCited: string[]) => void;
  giveUp: () => void;
  updateNotes: (text: string) => void;
}

// ---------------------------------------------------------------------------
// The hook
// ---------------------------------------------------------------------------

export function useGameState(): GameStateHook {
  const initial: HookState = loadPersistedState() ?? {
    game: null, notes: "", streamingText: null, loading: false, error: null,
  };

  const [state, dispatch] = useReducer(hookReducer, initial);

  useEffect(() => { persistState(state); }, [state.game, state.notes]);

  // -- Start game --
  // Calls /api/start to get ClientMystery + initial ClientGameState from the server.

  const startGame = useCallback((mysteryId: string) => {
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "SET_LOADING", loading: true });
    apiPost<{ clientMystery: ClientMystery; state: ClientGameState }>("/api/start", {
      mysteryId,
    })
      .then(({ state: initialState }) => {
        dispatch({ type: "SET_GAME", game: initialState });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => dispatch({ type: "SET_ERROR", error: err.message }));
  }, []);

  // -- Focus (navigate) --
  // If leaving a character with messages, auto-summarize first.

  const doFocus = useCallback((target: FocusTarget) => {
    if (!state.game) return;
    const game = state.game;

    // Check if we're leaving a character with messages
    const leavingCharacter =
      game.focus.type === "character" &&
      (target.type !== "character" || target.id !== game.focus.id);

    if (leavingCharacter) {
      const characterId = game.focus.id;
      const conversation = clientGetConversation(game, characterId);
      const hasMessages = conversation && conversation.messages.length > 0;
      const lastSummaryCount = conversation?.summaries.length ?? 0;
      const needsSummary = hasMessages && conversation.messages.length > lastSummaryCount * 2;

      if (needsSummary) {
        dispatch({ type: "SET_LOADING", loading: true });
        apiPost<FocusResult["conversationEnded"]>("/api/summarize", apiBody(game, { characterId }))
          .then((conversationEnded) => {
            const focusResult: FocusResult = { conversationEnded: conversationEnded ?? undefined };
            const next = applyFocus(asGameState(game), { type: "FOCUS", target }, focusResult, Date.now());
            dispatch({ type: "SET_GAME", game: asClientState(next) });
            dispatch({ type: "SET_LOADING", loading: false });
          })
          .catch((err) => {
            const next = applyFocus(asGameState(game), { type: "FOCUS", target }, undefined, Date.now());
            dispatch({ type: "SET_GAME", game: asClientState(next) });
            dispatch({ type: "SET_ERROR", error: err.message });
          });
        return;
      }
    }

    const next = applyFocus(asGameState(game), { type: "FOCUS", target }, undefined, Date.now());
    dispatch({ type: "SET_GAME", game: asClientState(next) });
  }, [state.game]);

  // -- Interact (examine or speak) --

  const interact = useCallback((message: string) => {
    if (!state.game) return;
    const game = state.game;
    const action = { type: "INTERACT" as const, message };

    if (game.focus.type === "location") {
      // Examine — non-streaming
      dispatch({ type: "SET_LOADING", loading: true });
      apiPost<ExamineInteractResult>("/api/examine", apiBody(game, { message }))
        .then((result) => {
          const next = applyInteract(asGameState(game), action, result, Date.now());
          dispatch({ type: "SET_GAME", game: asClientState(next) });
          dispatch({ type: "SET_LOADING", loading: false });
        })
        .catch((err) => dispatch({ type: "SET_ERROR", error: err.message }));
    } else {
      // Speak — SSE streaming
      dispatch({ type: "SET_LOADING", loading: true });
      dispatch({ type: "SET_STREAMING", text: "" });

      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody(game, { message })),
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
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

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

          const result: SpeakInteractResult = { context: "character", response: fullText, cluesRevealed };
          const next = applyInteract(asGameState(game), action, result, Date.now());
          dispatch({ type: "SET_GAME", game: asClientState(next) });
          dispatch({ type: "SET_STREAMING", text: null });
          dispatch({ type: "SET_LOADING", loading: false });
        })
        .catch((err) => {
          dispatch({ type: "SET_STREAMING", text: null });
          dispatch({ type: "SET_ERROR", error: err.message });
        });
    }
  }, [state.game]);

  // -- Solve --

  const solve = useCallback(
    (answers: Record<string, string>, evidenceCited: string[]) => {
      if (!state.game) return;
      const game = state.game;

      dispatch({ type: "SET_LOADING", loading: true });
      apiPost<SolveResult>("/api/solve", apiBody(game, { answers, evidenceCited }))
        .then((result) => {
          const next = applySolve(
            asGameState(game),
            { type: "SOLVE", answers, evidenceCited },
            result,
            Date.now(),
          );
          dispatch({ type: "SET_GAME", game: asClientState(next) });
          dispatch({ type: "SET_LOADING", loading: false });
        })
        .catch((err) => dispatch({ type: "SET_ERROR", error: err.message }));
    },
    [state.game],
  );

  // -- Give up --

  const doGiveUp = useCallback(() => {
    if (!state.game) return;
    const game = state.game;

    dispatch({ type: "SET_LOADING", loading: true });
    apiPost<{ narrative: string }>("/api/give-up", apiBody(game))
      .then(() => {
        const next = applyGiveUp(asGameState(game), { type: "GIVE_UP" }, undefined);
        dispatch({ type: "SET_GAME", game: asClientState(next) });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => dispatch({ type: "SET_ERROR", error: err.message }));
  }, [state.game]);

  // -- Notes --

  const updateNotes = useCallback((text: string) => {
    dispatch({ type: "UPDATE_NOTES", text });
  }, []);

  // -- Derived state (uses client-side functions) --

  const derived = useMemo(() => {
    if (!state.game) {
      return {
        discoveredClues: [] as ClientClue[],
        visitedLocations: new Set<string>(),
        interviewedCharacters: new Set<string>(),
        progress: 0,
        eventLog: [] as EventEntry[],
      };
    }
    return {
      discoveredClues: clientDiscoveredClues(state.game),
      visitedLocations: clientVisitedLocationIds(state.game),
      interviewedCharacters: clientInterviewedCharacterIds(state.game),
      progress: clientInvestigationProgress(state.game),
      // deriveEventLog only accesses explorations, conversations, theories — safe with client state
      eventLog: deriveEventLog(state.game as unknown as GameState),
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
    startGame,
    focus: doFocus,
    interact,
    solve,
    giveUp: doGiveUp,
    updateNotes,
  };
}
