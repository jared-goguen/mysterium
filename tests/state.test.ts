import { describe, it, expect } from "bun:test";
import mystery from "../examples/blue-parrot";
import { createGameState } from "../lib/initializers";
import { validateAction } from "../lib/validators";
import {
  applyMove,
  applyExamine,
  applyTalk,
  applySay,
  applyEndConversation,
  applyAccuse,
  applyGiveUp,
} from "../lib/reducer";
import {
  discoveredClueIds,
  discoveredClues,
  visitedLocationIds,
  interviewedCharacterIds,
  investigationProgress,
  failedAccusationCount,
  getConversation,
} from "../types/state";
import { deriveEventLog } from "../lib/events";
import { serialize, deserialize } from "../lib/persistence";
import type { GameState } from "../types/state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function freshState(): GameState {
  return createGameState(mystery);
}

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

describe("createGameState", () => {
  it("creates a valid initial state", () => {
    const state = freshState();
    expect(state.phase).toBe("playing");
    expect(state.explorations).toHaveLength(0);
    expect(state.conversations).toHaveLength(0);
    expect(state.accusations).toHaveLength(0);
    expect(state.focus).toEqual({ type: "location", id: "main-floor" });
    expect(state.startedAt).toBeGreaterThan(0);
  });

  it("initializes NPC states for all characters", () => {
    const state = freshState();
    expect(Object.keys(state.npcStates)).toHaveLength(5);
    for (const npc of Object.values(state.npcStates)) {
      expect(npc.emotion).toBe("calm");
      expect(npc.cooperativeness).toBe(100);
      expect(npc.awareness).toHaveLength(0);
    }
  });

  it("preserves the mystery reference", () => {
    const state = freshState();
    expect(state.mystery.id).toBe("blue-parrot-001");
    expect(state.mystery.characters).toHaveLength(5);
    expect(state.mystery.locations).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("validateAction", () => {
  it("allows MOVE to valid location", () => {
    const state = freshState();
    const result = validateAction(state, {
      type: "MOVE",
      locationId: "victors-office",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects MOVE to unknown location", () => {
    const state = freshState();
    const result = validateAction(state, {
      type: "MOVE",
      locationId: "nonexistent",
    });
    expect(result.valid).toBe(false);
  });

  it("allows EXAMINE at current location", () => {
    const state = freshState(); // focus is main-floor
    const result = validateAction(state, {
      type: "EXAMINE",
      locationId: "main-floor",
      query: "the bar",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects EXAMINE at wrong location", () => {
    const state = freshState(); // focus is main-floor
    const result = validateAction(state, {
      type: "EXAMINE",
      locationId: "victors-office",
      query: "the desk",
    });
    expect(result.valid).toBe(false);
  });

  it("rejects EXAMINE with empty query", () => {
    const state = freshState();
    const result = validateAction(state, {
      type: "EXAMINE",
      locationId: "main-floor",
      query: "  ",
    });
    expect(result.valid).toBe(false);
  });

  it("allows TALK with cooperative character", () => {
    const state = freshState();
    const result = validateAction(state, {
      type: "TALK",
      characterId: "tommy",
    });
    expect(result.valid).toBe(true);
  });

  it("rejects TALK with hostile character", () => {
    const state = freshState();
    state.npcStates["tommy"] = {
      ...state.npcStates["tommy"]!,
      cooperativeness: 0,
    };
    const result = validateAction(state, {
      type: "TALK",
      characterId: "tommy",
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("refuses");
  });

  it("rejects ACCUSE with no clues discovered", () => {
    const state = freshState();
    const result = validateAction(state, {
      type: "ACCUSE",
      suspectId: "dolores",
      motive: "insurance money",
      method: "poison",
      evidenceCited: [],
    });
    expect(result.valid).toBe(false);
    expect(result.reason).toContain("evidence");
  });

  it("rejects actions when game is over", () => {
    const state = { ...freshState(), phase: "solved" as const };
    const result = validateAction(state, {
      type: "MOVE",
      locationId: "main-floor",
    });
    expect(result.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Reducer — MOVE
// ---------------------------------------------------------------------------

describe("applyMove", () => {
  it("changes focus to the target location", () => {
    const state = freshState();
    const next = applyMove(state, {
      type: "MOVE",
      locationId: "victors-office",
    });
    expect(next.focus).toEqual({ type: "location", id: "victors-office" });
  });

  it("does not mutate the original state", () => {
    const state = freshState();
    applyMove(state, { type: "MOVE", locationId: "victors-office" });
    expect(state.focus.id).toBe("main-floor");
  });
});

// ---------------------------------------------------------------------------
// Reducer — EXAMINE
// ---------------------------------------------------------------------------

describe("applyExamine", () => {
  it("logs an exploration with no clue", () => {
    const state = freshState();
    const next = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "the bar" },
      { narrative: "A well-worn bar.", clueFound: null },
    );
    expect(next.explorations).toHaveLength(1);
    expect(next.explorations[0]!.clueFound).toBeNull();
    expect(next.explorations[0]!.query).toBe("the bar");
    expect(discoveredClueIds(next).size).toBe(0);
  });

  it("logs an exploration with a clue", () => {
    let state = applyMove(freshState(), {
      type: "MOVE",
      locationId: "victors-office",
    });
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "victors-office", query: "the trash bin" },
      { narrative: "You find a movie ticket stub.", clueFound: "clue-movie-stub" },
    );
    expect(discoveredClueIds(state).has("clue-movie-stub")).toBe(true);
    expect(discoveredClues(state)).toHaveLength(1);
    expect(discoveredClues(state)[0]!.id).toBe("clue-movie-stub");
  });

  it("tracks visited locations via explorations", () => {
    let state = freshState();
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "look around" },
      { narrative: "The main floor stretches before you.", clueFound: null },
    );
    state = applyMove(state, { type: "MOVE", locationId: "victors-office" });
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "victors-office", query: "look around" },
      { narrative: "Victor's office is cramped.", clueFound: null },
    );
    expect(visitedLocationIds(state).size).toBe(2);
    expect(visitedLocationIds(state).has("main-floor")).toBe(true);
    expect(visitedLocationIds(state).has("victors-office")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reducer — TALK + SAY
// ---------------------------------------------------------------------------

describe("applyTalk + applySay", () => {
  it("creates a conversation on first TALK", () => {
    const state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    expect(state.focus).toEqual({ type: "character", id: "tommy" });
    expect(state.conversations).toHaveLength(1);
    expect(state.conversations[0]!.characterId).toBe("tommy");
    expect(state.conversations[0]!.messages).toHaveLength(0);
  });

  it("does not duplicate conversation on repeat TALK", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    state = applyMove(state, { type: "MOVE", locationId: "main-floor" });
    state = applyTalk(state, { type: "TALK", characterId: "tommy" });
    expect(state.conversations).toHaveLength(1);
  });

  it("appends player + NPC messages on SAY", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    state = applySay(
      state,
      { type: "SAY", characterId: "tommy", message: "Where were you at 10?" },
      { response: "Behind the bar, like always.", cluesRevealed: [] },
    );
    const convo = getConversation(state, "tommy");
    expect(convo).toBeDefined();
    expect(convo!.messages).toHaveLength(2);
    expect(convo!.messages[0]!.role).toBe("player");
    expect(convo!.messages[1]!.role).toBe("npc");
  });

  it("tracks interviewed characters", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    state = applyTalk(
      applyMove(state, { type: "MOVE", locationId: "main-floor" }),
      { type: "TALK", characterId: "marlene" },
    );
    expect(interviewedCharacterIds(state).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// Reducer — END_CONVERSATION
// ---------------------------------------------------------------------------

describe("applyEndConversation", () => {
  it("adds summary and spreads information", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    state = applySay(
      state,
      { type: "SAY", characterId: "tommy", message: "Tell me about Victor." },
      { response: "He was a hard man.", cluesRevealed: [] },
    );
    state = applyEndConversation(
      state,
      { type: "END_CONVERSATION", characterId: "tommy" },
      {
        summary: {
          topicsDiscussed: ["Victor's character"],
          informationRevealed: ["Victor was difficult to work for"],
          emotionalStateAfter: "nervous",
          contradictionsExposed: [],
          cluesDiscovered: [],
        },
        informationSpread: {
          marlene: ["Investigator asked Tommy about Victor"],
          frank: ["Investigator is questioning staff"],
        },
        npcStateUpdates: {
          tommy: "nervous",
        },
      },
    );

    // Summary added
    const convo = getConversation(state, "tommy");
    expect(convo!.summaries).toHaveLength(1);

    // Information spread
    expect(state.npcStates["marlene"]!.awareness).toContain(
      "Investigator asked Tommy about Victor",
    );
    expect(state.npcStates["frank"]!.awareness).toContain(
      "Investigator is questioning staff",
    );

    // Emotion updated
    expect(state.npcStates["tommy"]!.emotion).toBe("nervous");

    // Focus returns to location
    expect(state.focus.type).toBe("location");
  });

  it("discovers testimonial clues via summaries", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "eddie",
    });
    state = applySay(
      state,
      { type: "SAY", characterId: "eddie", message: "What about Dolores?" },
      { response: "She asked about insurance...", cluesRevealed: ["clue-insurance"] },
    );
    state = applyEndConversation(
      state,
      { type: "END_CONVERSATION", characterId: "eddie" },
      {
        summary: {
          topicsDiscussed: ["Dolores"],
          informationRevealed: ["Dolores asked about life insurance"],
          emotionalStateAfter: "anxious",
          contradictionsExposed: [],
          cluesDiscovered: ["clue-insurance"],
        },
        informationSpread: {},
        npcStateUpdates: {},
      },
    );

    expect(discoveredClueIds(state).has("clue-insurance")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Reducer — ACCUSE
// ---------------------------------------------------------------------------

describe("applyAccuse", () => {
  function stateWithClue(): GameState {
    return applyExamine(
      freshState(),
      { type: "EXAMINE", locationId: "main-floor", query: "look around" },
      { narrative: "You notice something.", clueFound: "clue-movie-stub" },
    );
  }

  it("handles correct accusation — game solved", () => {
    const state = applyAccuse(
      stateWithClue(),
      {
        type: "ACCUSE",
        suspectId: "dolores",
        motive: "insurance money",
        method: "cyanide in the whiskey",
        evidenceCited: ["clue-movie-stub"],
      },
      {
        outcome: "correct",
        consequence: {
          narrative: "You've solved the case.",
          npcStateChanges: { dolores: "defeated" },
          secretsRevealed: ["dolores"],
          gameOver: true,
        },
      },
    );

    expect(state.phase).toBe("solved");
    expect(state.accusations).toHaveLength(1);
    expect(state.accusations[0]!.outcome).toBe("correct");
    expect(state.npcStates["dolores"]!.emotion).toBe("defeated");
  });

  it("handles wrong accusation — game continues with consequences", () => {
    const state = applyAccuse(
      stateWithClue(),
      {
        type: "ACCUSE",
        suspectId: "frank",
        motive: "gambling debts",
        method: "intimidation gone wrong",
        evidenceCited: ["clue-movie-stub"],
      },
      {
        outcome: "wrong",
        consequence: {
          narrative: "Frank is furious.",
          npcStateChanges: { frank: "hostile" },
          secretsRevealed: [],
          gameOver: false,
        },
      },
    );

    expect(state.phase).toBe("playing");
    expect(state.accusations).toHaveLength(1);
    expect(state.npcStates["frank"]!.emotion).toBe("hostile");
    // Cooperativeness reduced for the wrongly accused
    expect(state.npcStates["frank"]!.cooperativeness).toBe(60);
    expect(failedAccusationCount(state)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Reducer — GIVE_UP
// ---------------------------------------------------------------------------

describe("applyGiveUp", () => {
  it("sets phase to revealed", () => {
    const state = applyGiveUp(freshState(), { type: "GIVE_UP" });
    expect(state.phase).toBe("revealed");
  });
});

// ---------------------------------------------------------------------------
// Derived state
// ---------------------------------------------------------------------------

describe("investigationProgress", () => {
  it("starts at 0", () => {
    expect(investigationProgress(freshState())).toBe(0);
  });

  it("increases as clues are found", () => {
    let state = freshState();
    // Find 1 of 6 clues
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "trash" },
      { narrative: "Found something.", clueFound: "clue-movie-stub" },
    );
    const progress = investigationProgress(state);
    expect(progress).toBeCloseTo(1 / 6);
  });
});

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

describe("deriveEventLog", () => {
  it("returns empty for fresh state", () => {
    expect(deriveEventLog(freshState())).toHaveLength(0);
  });

  it("creates entries for explorations", () => {
    let state = freshState();
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "the bar" },
      { narrative: "Nothing special.", clueFound: null },
    );
    const log = deriveEventLog(state);
    expect(log).toHaveLength(1);
    expect(log[0]!.type).toBe("examine");
    expect(log[0]!.icon).toBe("👁");
  });

  it("distinguishes clue discovery from normal examination", () => {
    let state = freshState();
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "trash" },
      { narrative: "A movie stub!", clueFound: "clue-movie-stub" },
    );
    const log = deriveEventLog(state);
    expect(log).toHaveLength(1);
    expect(log[0]!.type).toBe("examine_clue");
    expect(log[0]!.icon).toBe("🔍");
  });

  it("includes conversations and accusations", () => {
    let state = applyTalk(freshState(), {
      type: "TALK",
      characterId: "tommy",
    });
    state = applyExamine(
      applyMove(state, { type: "MOVE", locationId: "main-floor" }),
      { type: "EXAMINE", locationId: "main-floor", query: "bar" },
      { narrative: "Found something.", clueFound: "clue-movie-stub" },
    );
    state = applyAccuse(
      state,
      {
        type: "ACCUSE",
        suspectId: "frank",
        motive: "debts",
        method: "poison",
        evidenceCited: ["clue-movie-stub"],
      },
      {
        outcome: "wrong",
        consequence: {
          narrative: "Wrong.",
          npcStateChanges: {},
          secretsRevealed: [],
          gameOver: false,
        },
      },
    );
    const log = deriveEventLog(state);
    expect(log.length).toBeGreaterThanOrEqual(3);
    expect(log.some((e) => e.type === "talk")).toBe(true);
    expect(log.some((e) => e.type === "examine_clue")).toBe(true);
    expect(log.some((e) => e.type === "accuse_wrong")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe("serialize / deserialize", () => {
  it("round-trips a fresh state", () => {
    const state = freshState();
    const json = serialize(state);
    const restored = deserialize(json);
    expect(restored.mystery.id).toBe(state.mystery.id);
    expect(restored.phase).toBe(state.phase);
    expect(restored.focus).toEqual(state.focus);
  });

  it("round-trips a state with explorations and conversations", () => {
    let state = freshState();
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "bar" },
      { narrative: "Clean bar.", clueFound: null },
    );
    state = applyTalk(state, { type: "TALK", characterId: "tommy" });
    state = applySay(
      state,
      { type: "SAY", characterId: "tommy", message: "Hello" },
      { response: "Evening.", cluesRevealed: [] },
    );

    const restored = deserialize(serialize(state));
    expect(restored.explorations).toHaveLength(1);
    expect(restored.conversations).toHaveLength(1);
    expect(getConversation(restored, "tommy")!.messages).toHaveLength(2);
  });

  it("preserves discovered clues through round-trip", () => {
    let state = freshState();
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "main-floor", query: "trash" },
      { narrative: "Stub.", clueFound: "clue-movie-stub" },
    );

    const restored = deserialize(serialize(state));
    expect(discoveredClueIds(restored).has("clue-movie-stub")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Full evidence chain scenario
// ---------------------------------------------------------------------------

describe("full evidence chain", () => {
  it("discovers all 4 chain clues and solves the mystery", () => {
    let state = freshState();

    // Clue 1: Movie stub in Victor's office trash
    state = applyMove(state, { type: "MOVE", locationId: "victors-office" });
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "victors-office", query: "the trash bin" },
      { narrative: "A movie ticket stub...", clueFound: "clue-movie-stub" },
    );

    // Clue 2: Perfume in the office air
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "victors-office", query: "the air" },
      { narrative: "Shalimar perfume...", clueFound: "clue-perfume" },
    );

    // Clue 3: Rat poison receipt in the dumpster
    state = applyMove(state, { type: "MOVE", locationId: "back-alley" });
    state = applyExamine(
      state,
      { type: "EXAMINE", locationId: "back-alley", query: "the dumpster" },
      { narrative: "A receipt for rat poison...", clueFound: "clue-rat-poison" },
    );

    // Clue 4: Eddie's testimony about insurance
    state = applyTalk(state, { type: "TALK", characterId: "eddie" });
    state = applySay(
      state,
      { type: "SAY", characterId: "eddie", message: "Tell me about Dolores." },
      {
        response: "She'd been asking about Victor's life insurance...",
        cluesRevealed: ["clue-insurance"],
      },
    );
    state = applyEndConversation(
      state,
      { type: "END_CONVERSATION", characterId: "eddie" },
      {
        summary: {
          topicsDiscussed: ["Dolores", "insurance"],
          informationRevealed: ["Dolores researched the insurance policy"],
          emotionalStateAfter: "anxious",
          contradictionsExposed: [],
          cluesDiscovered: ["clue-insurance"],
        },
        informationSpread: {},
        npcStateUpdates: { eddie: "anxious" },
      },
    );

    // Verify all 4 chain clues discovered
    const found = discoveredClueIds(state);
    expect(found.has("clue-movie-stub")).toBe(true);
    expect(found.has("clue-perfume")).toBe(true);
    expect(found.has("clue-rat-poison")).toBe(true);
    expect(found.has("clue-insurance")).toBe(true);

    // Progress: 4 of 6 total clues found
    expect(investigationProgress(state)).toBeCloseTo(4 / 6);

    // Make the accusation
    state = applyAccuse(
      state,
      {
        type: "ACCUSE",
        suspectId: "dolores",
        motive: "Insurance payout and freedom from Victor",
        method: "Cyanide in his whiskey, swapped the glass during the second set",
        evidenceCited: [
          "clue-movie-stub",
          "clue-perfume",
          "clue-rat-poison",
          "clue-insurance",
        ],
      },
      {
        outcome: "correct",
        consequence: {
          narrative:
            "Dolores Morel crumbles. The perfume, the stub, the receipt — each piece locks into place like tumblers in a safe.",
          npcStateChanges: {
            dolores: "defeated",
            eddie: "devastated",
            tommy: "relieved",
            marlene: "shaken",
            frank: "smug",
          },
          secretsRevealed: ["dolores"],
          gameOver: true,
        },
      },
    );

    // Game is solved
    expect(state.phase).toBe("solved");
    expect(state.accusations).toHaveLength(1);
    expect(state.accusations[0]!.outcome).toBe("correct");

    // Event log captures the full journey
    const log = deriveEventLog(state);
    expect(log.length).toBeGreaterThanOrEqual(6); // examinations + talk + accusation
    expect(log[log.length - 1]!.type).toBe("accuse_correct");
  });
});
