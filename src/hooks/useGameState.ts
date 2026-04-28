/**
 * useGameState.ts — Real game state hook backed by AI engines
 *
 * Four actions: focus, interact, solve, giveUp.
 * FOCUS auto-summarizes when leaving a character.
 * INTERACT dispatches to /api/examine or /api/chat based on focus context.
 */

import { useReducer, useCallback, useMemo, useEffect } from "react";
import blueParrot from "../../examples/blue-parrot";
import { createGameState } from "../../lib/initializers";
import {
  applyFocus,
  applyInteract,
  applySolve,
  applyGiveUp,
} from "../../lib/reducer";
import {
  discoveredClues,
  visitedLocationIds,
  interviewedCharacterIds,
  investigationProgress,
  getConversation,
} from "../../types/state";
import { deriveEventLog } from "../../lib/events";
import type { EventEntry } from "../../lib/events";
import type { GameState } from "../../types/state";
import type { Mystery, Clue } from "../../types/mystery";
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
  game: GameState | null;
  notes: string;
  streamingText: string | null;
  loading: boolean;
  error: string | null;
}

type HookAction =
  | { type: "START_GAME"; mystery: Mystery }
  | { type: "SET_GAME"; game: GameState }
  | { type: "UPDATE_NOTES"; text: string }
  | { type: "SET_STREAMING"; text: string | null }
  | { type: "SET_LOADING"; loading: boolean }
  | { type: "SET_ERROR"; error: string | null };

function hookReducer(state: HookState, action: HookAction): HookState {
  switch (action.type) {
    case "START_GAME":
      return { game: createGameState(action.mystery), notes: "", streamingText: null, loading: false, error: null };
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
      const parsed = JSON.parse(raw) as { game: GameState | null; notes: string };
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

// ---------------------------------------------------------------------------
// Return type
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
  streamingText: string | null;
  loading: boolean;
  error: string | null;

  startGame: () => void;
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

  const startGame = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    dispatch({ type: "START_GAME", mystery: blueParrot });
  }, []);

  // -- Focus (navigate) --
  // If leaving a character with messages, auto-summarize first.

  const doFocus = useCallback((target: FocusTarget) => {
    if (!state.game) return;
    const gameState = state.game;

    // Check if we're leaving a character with messages
    const leavingCharacter =
      gameState.focus.type === "character" &&
      (target.type !== "character" || target.id !== gameState.focus.id);

    if (leavingCharacter) {
      const characterId = gameState.focus.id;
      const conversation = getConversation(gameState, characterId);
      const hasMessages = conversation && conversation.messages.length > 0;
      // Only summarize if there are unsummarized messages
      const lastSummaryCount = conversation?.summaries.length ?? 0;
      const needsSummary = hasMessages && conversation.messages.length > lastSummaryCount * 2;

      if (needsSummary) {
        dispatch({ type: "SET_LOADING", loading: true });
        apiPost<FocusResult["conversationEnded"]>("/api/summarize", {
          gameState,
          characterId,
        })
          .then((conversationEnded) => {
            const focusResult: FocusResult = { conversationEnded: conversationEnded ?? undefined };
            const next = applyFocus(gameState, { type: "FOCUS", target }, focusResult, Date.now());
            dispatch({ type: "SET_GAME", game: next });
            dispatch({ type: "SET_LOADING", loading: false });
          })
          .catch((err) => {
            // Even on error, still move focus
            const next = applyFocus(gameState, { type: "FOCUS", target }, undefined, Date.now());
            dispatch({ type: "SET_GAME", game: next });
            dispatch({ type: "SET_ERROR", error: err.message });
          });
        return;
      }
    }

    // No summarization needed — just move focus
    const next = applyFocus(gameState, { type: "FOCUS", target }, undefined, Date.now());
    dispatch({ type: "SET_GAME", game: next });
  }, [state.game]);

  // -- Interact (examine or speak) --

  const interact = useCallback((message: string) => {
    if (!state.game) return;
    const gameState = state.game;
    const action = { type: "INTERACT" as const, message };

    if (gameState.focus.type === "location") {
      // Examine — non-streaming
      dispatch({ type: "SET_LOADING", loading: true });
      apiPost<ExamineInteractResult>("/api/examine", { gameState, message })
        .then((result) => {
          const next = applyInteract(gameState, action, result, Date.now());
          dispatch({ type: "SET_GAME", game: next });
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
        body: JSON.stringify({ gameState, message }),
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
          const next = applyInteract(gameState, action, result, Date.now());
          dispatch({ type: "SET_GAME", game: next });
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
      const gameState = state.game;

      dispatch({ type: "SET_LOADING", loading: true });
      apiPost<SolveResult>("/api/solve", { gameState, answers, evidenceCited })
        .then((result) => {
          const next = applySolve(
            gameState,
            { type: "SOLVE", answers, evidenceCited },
            result,
            Date.now(),
          );
          dispatch({ type: "SET_GAME", game: next });
          dispatch({ type: "SET_LOADING", loading: false });
        })
        .catch((err) => dispatch({ type: "SET_ERROR", error: err.message }));
    },
    [state.game],
  );

  // -- Give up --

  const doGiveUp = useCallback(() => {
    if (!state.game) return;
    const gameState = state.game;

    dispatch({ type: "SET_LOADING", loading: true });
    apiPost<{ narrative: string }>("/api/give-up", { gameState })
      .then(() => {
        const next = applyGiveUp(gameState, { type: "GIVE_UP" }, undefined);
        dispatch({ type: "SET_GAME", game: next });
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
    startGame,
    focus: doFocus,
    interact,
    solve,
    giveUp: doGiveUp,
    updateNotes,
  };
}
