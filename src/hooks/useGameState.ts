/**
 * useGameState.ts — Real game state hook backed by AI engines
 *
 * Four actions mirroring the API:
 *   focus(target)    → POST /api/focus (server auto-summarizes)
 *   interact(message) → POST /api/interact (always SSE, server routes by focus)
 *   solve(...)       → POST /api/solve
 *   giveUp()        → POST /api/give-up
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
} from "../../types/client";
import type {
  FocusResult,
  InteractResult,
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
  pendingMessage: string | null;
  loading: boolean;
  error: string | null;
}

type HookAction =
  | { type: "SET_GAME"; game: ClientGameState }
  | { type: "UPDATE_NOTES"; text: string }
  | { type: "SET_STREAMING"; text: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "SET_PENDING"; message: string | null }
  | { type: "MERGE_FOCUS_RESULT"; focusResult: FocusResult };

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
    case "SET_PENDING":
      return { ...state, pendingMessage: action.message };
    case "MERGE_FOCUS_RESULT": {
      if (!state.game) return state;
      const current = asGameState(state.game);
      const merged = applyFocus(
        current,
        { type: "FOCUS", target: current.focus },
        action.focusResult,
        Date.now(),
      );
      return { ...state, game: asClientState(merged) };
    }
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
      return { game: parsed.game, notes: parsed.notes, streamingText: null, pendingMessage: null, loading: false, error: null };
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

function apiBody(game: ClientGameState, extra?: Record<string, unknown>) {
  return { mysteryId: game.mystery.id, state: game, ...extra };
}

/**
 * Cast ClientGameState to GameState for the pure reducer functions.
 * Safe because reducers never access state.mystery fields.
 */
function asGameState(client: ClientGameState): GameState {
  return client as unknown as GameState;
}

function asClientState(game: GameState): ClientGameState {
  return game as unknown as ClientGameState;
}

/**
 * Read an SSE stream, calling onDelta for each text chunk and
 * returning the parsed "done" event payload.
 */
async function readSSE<T>(
  res: Response,
  onDelta?: (text: string) => void,
): Promise<T> {
  if (!res.ok || !res.body) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
    throw new Error(err.error ?? `API error: ${res.status}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: T | undefined;
  let eventType = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (line.startsWith("event: ")) {
        eventType = line.slice(7);
      } else if (line.startsWith("data: ")) {
        const data = JSON.parse(line.slice(6));
        if (eventType === "delta") {
          onDelta?.(data.text);
        } else if (eventType === "done") {
          result = data as T;
        } else if (eventType === "error") {
          throw new Error(data.message ?? data.error ?? "Unknown SSE error");
        }
      }
    }
  }

  if (!result) throw new Error("SSE stream ended without a done event");
  return result;
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
  pendingMessage: string | null;
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
    game: null, notes: "", streamingText: null, pendingMessage: null, loading: false, error: null,
  };

  const [state, dispatch] = useReducer(hookReducer, initial);

  useEffect(() => { persistState(state); }, [state.game, state.notes]);

  // -- Start game --

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
  // Server handles summarization automatically.

  const doFocus = useCallback((target: FocusTarget) => {
    if (!state.game) return;
    const game = state.game;

    const leavingCharacter =
      game.focus.type === "character" &&
      (target.type !== "character" || target.id !== game.focus.id);

    // Always navigate immediately — never block on summarization
    const next = applyFocus(asGameState(game), { type: "FOCUS", target }, undefined, Date.now());
    dispatch({ type: "SET_GAME", game: asClientState(next) });

    // Background summarization when leaving a character (non-blocking)
    if (leavingCharacter) {
      apiPost<{ focusResult: FocusResult }>("/api/focus", apiBody(game, { target }))
        .then(({ focusResult }) => {
          if (focusResult.conversationEnded) {
            dispatch({ type: "MERGE_FOCUS_RESULT", focusResult });
          }
        })
        .catch(() => {
          // Summarization failure is non-critical — skip silently
        });
    }
  }, [state.game]);

  // -- Interact --
  // Always SSE. Server routes to examine or converse based on focus.

  const interact = useCallback((message: string) => {
    if (!state.game) return;
    const game = state.game;
    const action = { type: "INTERACT" as const, message };

    dispatch({ type: "SET_LOADING", loading: true });
    // Show player message immediately (optimistic) for both locations and characters
    dispatch({ type: "SET_PENDING", message });
    dispatch({ type: "SET_STREAMING", text: "" });

    let fullText = "";

    fetch("/api/interact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(apiBody(game, { message })),
    })
      .then((res) =>
        readSSE<InteractResult>(res, (delta) => {
          fullText += delta;
          dispatch({ type: "SET_STREAMING", text: fullText });
        }),
      )
      .then((result) => {
        const next = applyInteract(asGameState(game), action, result, Date.now());
        dispatch({ type: "SET_GAME", game: asClientState(next) });
        dispatch({ type: "SET_PENDING", message: null });
        dispatch({ type: "SET_STREAMING", text: null });
        dispatch({ type: "SET_LOADING", loading: false });
      })
      .catch((err) => {
        dispatch({ type: "SET_PENDING", message: null });
        dispatch({ type: "SET_STREAMING", text: null });
        dispatch({ type: "SET_ERROR", error: err.message });
      });
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

  // -- Derived state --

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
    pendingMessage: state.pendingMessage,
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
