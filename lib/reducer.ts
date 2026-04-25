/**
 * reducer.ts — Pure state transitions
 *
 * Four actions: FOCUS, INTERACT, SOLVE, GIVE_UP.
 * Each has a typed apply* function + a general reduce() dispatcher.
 */

import type { GameState, Conversation } from "../types/state";
import type {
  FocusAction,
  FocusResult,
  InteractAction,
  InteractResult,
  SolveAction,
  SolveResult,
  GiveUpAction,
  GiveUpResult,
} from "../types/actions";

// ---------------------------------------------------------------------------
// FOCUS — navigate to a location or character
// ---------------------------------------------------------------------------

/**
 * Apply a FOCUS action. Changes the current target.
 * If the FocusResult includes a conversation summary (player was leaving
 * a character), that's applied to state as well.
 */
export function applyFocus(
  state: GameState,
  action: FocusAction,
  result?: FocusResult,
): GameState {
  let next = { ...state, focus: action.target };

  // If leaving a character, apply conversation summary
  if (result?.conversationEnded) {
    const { characterId, summary, informationSpread, npcStateUpdates } =
      result.conversationEnded;

    // Add summary to conversation
    const conversations = next.conversations.map((c) => {
      if (c.characterId !== characterId) return c;
      return { ...c, summaries: [...c.summaries, summary] };
    });

    // Update NPC states
    const npcStates = { ...next.npcStates };

    for (const [charId, newAwareness] of Object.entries(informationSpread)) {
      const existing = npcStates[charId];
      if (existing) {
        npcStates[charId] = {
          ...existing,
          awareness: [...existing.awareness, ...newAwareness],
        };
      }
    }

    for (const [charId, newEmotion] of Object.entries(npcStateUpdates)) {
      const existing = npcStates[charId];
      if (existing) {
        npcStates[charId] = { ...existing, emotion: newEmotion };
      }
    }

    next = { ...next, conversations, npcStates };
  }

  // If focusing on a character, ensure a conversation exists
  if (action.target.type === "character") {
    const existing = next.conversations.find(
      (c) => c.characterId === action.target.id,
    );
    if (!existing) {
      next = {
        ...next,
        conversations: [
          ...next.conversations,
          {
            characterId: action.target.id,
            messages: [],
            summaries: [],
            startedAt: Date.now(),
            lastMessageAt: Date.now(),
          } satisfies Conversation,
        ],
      };
    }
  }

  return next;
}

// ---------------------------------------------------------------------------
// INTERACT — context-dependent: examine (location) or speak (character)
// ---------------------------------------------------------------------------

export function applyInteract(
  state: GameState,
  action: InteractAction,
  result: InteractResult,
): GameState {
  if (result.context === "location") {
    // Examination
    return {
      ...state,
      explorations: [
        ...state.explorations,
        {
          locationId: state.focus.id,
          query: action.message,
          clueFound: result.clueFound,
          narrative: result.narrative,
          timestamp: Date.now(),
        },
      ],
    };
  } else {
    // Conversation
    const now = Date.now();
    const conversations = state.conversations.map((c) => {
      if (c.characterId !== state.focus.id) return c;
      return {
        ...c,
        messages: [
          ...c.messages,
          { role: "player" as const, content: action.message, timestamp: now },
          { role: "npc" as const, content: result.response, timestamp: now },
        ],
        lastMessageAt: now,
      };
    });
    return { ...state, conversations };
  }
}

// ---------------------------------------------------------------------------
// SOLVE — present timeline reconstruction
// ---------------------------------------------------------------------------

export function applySolve(
  state: GameState,
  action: SolveAction,
  result: SolveResult,
): GameState {
  const theory = {
    answers: action.answers,
    evidenceCited: action.evidenceCited,
    momentResults: result.momentResults,
    score: result.score,
    outcome: result.outcome,
    narrative: result.narrative,
    npcStateChanges: result.npcStateChanges,
    gameOver: result.gameOver,
    timestamp: Date.now(),
  };

  // Apply NPC state changes
  const npcStates = { ...state.npcStates };
  for (const [charId, newEmotion] of Object.entries(result.npcStateChanges)) {
    const existing = npcStates[charId];
    if (existing) {
      npcStates[charId] = { ...existing, emotion: newEmotion };
    }
  }

  const phase = result.gameOver ? "solved" : state.phase;

  return {
    ...state,
    theories: [...state.theories, theory],
    npcStates,
    phase,
  };
}

// ---------------------------------------------------------------------------
// GIVE_UP — reveal the solution
// ---------------------------------------------------------------------------

export function applyGiveUp(
  state: GameState,
  _action: GiveUpAction,
  _result?: GiveUpResult,
): GameState {
  return { ...state, phase: "revealed" };
}

// ---------------------------------------------------------------------------
// General dispatcher
// ---------------------------------------------------------------------------

export type ReducerInput =
  | { action: FocusAction; result?: FocusResult }
  | { action: InteractAction; result: InteractResult }
  | { action: SolveAction; result: SolveResult }
  | { action: GiveUpAction; result?: GiveUpResult };

export function reduce(state: GameState, input: ReducerInput): GameState {
  switch (input.action.type) {
    case "FOCUS":
      return applyFocus(
        state,
        input.action,
        (input as { result?: FocusResult }).result,
      );
    case "INTERACT":
      return applyInteract(
        state,
        input.action,
        (input as { result: InteractResult }).result,
      );
    case "SOLVE":
      return applySolve(
        state,
        input.action,
        (input as { result: SolveResult }).result,
      );
    case "GIVE_UP":
      return applyGiveUp(
        state,
        input.action,
        (input as { result?: GiveUpResult }).result,
      );
  }
}
