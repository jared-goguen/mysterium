/**
 * reducer.ts — Pure state transitions
 *
 * The reducer takes the current state and an action (with its AI result)
 * and returns the next state. It never calls AI itself — that separation
 * is the caller's responsibility.
 *
 * Pattern: individual apply* functions for type safety,
 * plus a general `reduce` dispatcher for convenience.
 */

import type { GameState, Conversation } from "../types/state";
import type {
  MoveAction,
  ExamineAction,
  ExamineResult,
  TalkAction,
  SayAction,
  SayResult,
  EndConversationAction,
  EndConversationResult,
  AccuseAction,
  AccuseResult,
  GiveUpAction,
  GiveUpResult,
} from "../types/actions";

// ---------------------------------------------------------------------------
// Individual reducers — fully typed
// ---------------------------------------------------------------------------

/** MOVE: change focus to a location. */
export function applyMove(state: GameState, action: MoveAction): GameState {
  return {
    ...state,
    focus: { type: "location", id: action.locationId },
  };
}

/** EXAMINE: log an exploration, potentially discovering a clue. */
export function applyExamine(
  state: GameState,
  action: ExamineAction,
  result: ExamineResult,
): GameState {
  return {
    ...state,
    explorations: [
      ...state.explorations,
      {
        locationId: action.locationId,
        query: action.query,
        clueFound: result.clueFound,
        narrative: result.narrative,
        timestamp: Date.now(),
      },
    ],
  };
}

/** TALK: switch focus to a character, creating a conversation if needed. */
export function applyTalk(state: GameState, action: TalkAction): GameState {
  const existing = state.conversations.find(
    (c) => c.characterId === action.characterId,
  );

  const conversations = existing
    ? state.conversations
    : [
        ...state.conversations,
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
    focus: { type: "character", id: action.characterId },
    conversations,
  };
}

/** SAY: append player message + NPC response to the conversation. */
export function applySay(
  state: GameState,
  action: SayAction,
  result: SayResult,
): GameState {
  const now = Date.now();
  const conversations = state.conversations.map((c) => {
    if (c.characterId !== action.characterId) return c;
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

  // If testimonial clues were revealed, also add them to explorations
  // so discoveredClueIds picks them up from conversations summaries.
  // But testimonial clues from SAY are tracked via summaries in END_CONVERSATION.
  // For now, we just update the conversation messages.

  return { ...state, conversations };
}

/** END_CONVERSATION: add summary, spread information, update NPC states. */
export function applyEndConversation(
  state: GameState,
  action: EndConversationAction,
  result: EndConversationResult,
): GameState {
  // Add the summary to the conversation
  const conversations = state.conversations.map((c) => {
    if (c.characterId !== action.characterId) return c;
    return {
      ...c,
      summaries: [...c.summaries, result.summary],
    };
  });

  // Update NPC states: merge information spread and emotional updates
  const npcStates = { ...state.npcStates };

  // Spread information to other NPCs
  for (const [charId, newAwareness] of Object.entries(
    result.informationSpread,
  )) {
    const existing = npcStates[charId];
    if (existing) {
      npcStates[charId] = {
        ...existing,
        awareness: [...existing.awareness, ...newAwareness],
      };
    }
  }

  // Apply emotional state updates
  for (const [charId, newEmotion] of Object.entries(
    result.npcStateUpdates,
  )) {
    const existing = npcStates[charId];
    if (existing) {
      npcStates[charId] = {
        ...existing,
        emotion: newEmotion,
      };
    }
  }

  // Switch focus back to the location where the character is
  // (find the character's location from the mystery)
  const characterLocation = state.mystery.locations.find((l) =>
    l.charactersPresent.includes(action.characterId),
  );
  const focus = characterLocation
    ? { type: "location" as const, id: characterLocation.id }
    : state.focus;

  return { ...state, conversations, npcStates, focus };
}

/** ACCUSE: log the accusation, apply consequences, maybe end the game. */
export function applyAccuse(
  state: GameState,
  action: AccuseAction,
  result: AccuseResult,
): GameState {
  const accusation = {
    suspectId: action.suspectId,
    motive: action.motive,
    method: action.method,
    evidenceCited: action.evidenceCited,
    outcome: result.outcome,
    consequence: result.consequence,
    timestamp: Date.now(),
  };

  // Apply NPC state changes from consequences
  const npcStates = { ...state.npcStates };
  for (const [charId, newEmotion] of Object.entries(
    result.consequence.npcStateChanges,
  )) {
    const existing = npcStates[charId];
    if (existing) {
      npcStates[charId] = {
        ...existing,
        emotion: newEmotion,
        // Reduce cooperativeness for the accused (if wrong)
        cooperativeness:
          charId === action.suspectId && result.outcome === "wrong"
            ? Math.max(0, existing.cooperativeness - 40)
            : existing.cooperativeness,
      };
    }
  }

  const phase = result.consequence.gameOver ? "solved" : state.phase;

  return {
    ...state,
    accusations: [...state.accusations, accusation],
    npcStates,
    phase,
  };
}

/** GIVE_UP: reveal the solution. */
export function applyGiveUp(
  state: GameState,
  _action: GiveUpAction,
  _result?: GiveUpResult,
): GameState {
  return { ...state, phase: "revealed" };
}

// ---------------------------------------------------------------------------
// General dispatcher — routes to the right apply* function
// ---------------------------------------------------------------------------

/**
 * Discriminated union of action + result pairs.
 * Type-safe: each action variant carries exactly the result it needs.
 */
export type ReducerInput =
  | { action: MoveAction }
  | { action: ExamineAction; result: ExamineResult }
  | { action: TalkAction }
  | { action: SayAction; result: SayResult }
  | { action: EndConversationAction; result: EndConversationResult }
  | { action: AccuseAction; result: AccuseResult }
  | { action: GiveUpAction; result?: GiveUpResult };

/** General dispatcher. Prefer individual apply* functions when the action type is known. */
export function reduce(state: GameState, input: ReducerInput): GameState {
  switch (input.action.type) {
    case "MOVE":
      return applyMove(state, input.action);
    case "EXAMINE":
      return applyExamine(
        state,
        input.action,
        (input as { result: ExamineResult }).result,
      );
    case "TALK":
      return applyTalk(state, input.action);
    case "SAY":
      return applySay(
        state,
        input.action,
        (input as { result: SayResult }).result,
      );
    case "END_CONVERSATION":
      return applyEndConversation(
        state,
        input.action,
        (input as { result: EndConversationResult }).result,
      );
    case "ACCUSE":
      return applyAccuse(
        state,
        input.action,
        (input as { result: AccuseResult }).result,
      );
    case "GIVE_UP":
      return applyGiveUp(
        state,
        input.action,
        (input as { result?: GiveUpResult }).result,
      );
  }
}
