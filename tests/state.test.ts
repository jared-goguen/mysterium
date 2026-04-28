import { describe, it, expect } from "bun:test";
import mystery from "../examples/blue-parrot";
import { createGameState } from "../lib/initializers";
import { validateAction } from "../lib/validators";
import {
  applyFocus,
  applyInteract,
  applySolve,
  applyGiveUp,
} from "../lib/reducer";
import {
  discoveredClueIds,
  discoveredClues,
  visitedLocationIds,
  interviewedCharacterIds,
  investigationProgress,
  failedTheoryCount,
  getConversation,
} from "../types/state";
import { deriveEventLog } from "../lib/events";
import { serialize, deserialize } from "../lib/persistence";
import type { GameState } from "../types/state";
import {
  clientAvailableExaminables,
  stripToListItem,
  stripGameState,
} from "../types/client";
import type { ClientGameState } from "../types/client";
import type { Mystery } from "../types/mystery";

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
    expect(state.theories).toHaveLength(0);
    expect(state.focus).toEqual({ type: "location", id: "main-floor" });
  });

  it("initializes NPC states for all characters", () => {
    const state = freshState();
    expect(Object.keys(state.npcStates)).toHaveLength(5);
    for (const npc of Object.values(state.npcStates)) {
      expect(npc.emotion).toBe("calm");
      expect(npc.rapport).toBe(40);
    }
  });
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe("validateAction", () => {
  it("allows FOCUS to valid location", () => {
    const r = validateAction(freshState(), {
      type: "FOCUS",
      target: { type: "location", id: "victors-office" },
    });
    expect(r.valid).toBe(true);
  });

  it("rejects FOCUS to unknown location", () => {
    const r = validateAction(freshState(), {
      type: "FOCUS",
      target: { type: "location", id: "nonexistent" },
    });
    expect(r.valid).toBe(false);
  });

  it("allows INTERACT with non-empty message", () => {
    const r = validateAction(freshState(), {
      type: "INTERACT",
      message: "the bar",
    });
    expect(r.valid).toBe(true);
  });

  it("rejects INTERACT with empty message", () => {
    const r = validateAction(freshState(), {
      type: "INTERACT",
      message: "  ",
    });
    expect(r.valid).toBe(false);
  });

  it("allows FOCUS to character with low rapport", () => {
    const state = freshState();
    state.npcStates["tommy"] = { ...state.npcStates["tommy"]!, rapport: 0 };
    const r = validateAction(state, {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    });
    // Rapport affects conversation depth, not availability
    expect(r.valid).toBe(true);
  });

  it("rejects SOLVE with no clues", () => {
    const r = validateAction(freshState(), {
      type: "SOLVE",
      answers: { "moment-murder": "Dolores did it" },
      evidenceCited: [],
    });
    expect(r.valid).toBe(false);
    expect(r.reason).toContain("evidence");
  });

  it("rejects actions when game is over", () => {
    const state = { ...freshState(), phase: "solved" as const };
    const r = validateAction(state, {
      type: "FOCUS",
      target: { type: "location", id: "main-floor" },
    });
    expect(r.valid).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// FOCUS
// ---------------------------------------------------------------------------

describe("applyFocus", () => {
  it("changes focus to location", () => {
    const next = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "location", id: "victors-office" },
    }, undefined, 1000);
    expect(next.focus).toEqual({ type: "location", id: "victors-office" });
  });

  it("creates conversation on focus to character", () => {
    const next = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    expect(next.focus).toEqual({ type: "character", id: "tommy" });
    expect(next.conversations).toHaveLength(1);
    expect(next.conversations[0]!.characterId).toBe("tommy");
  });

  it("does not duplicate conversation on repeat focus", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    state = applyFocus(state, {
      type: "FOCUS",
      target: { type: "location", id: "main-floor" },
    }, undefined, 2000);
    state = applyFocus(state, {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 3000);
    expect(state.conversations).toHaveLength(1);
  });

  it("applies conversation summary when leaving character", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    // Add a message so the conversation has content
    state = applyInteract(state, { type: "INTERACT", message: "Hello" }, {
      context: "character",
      response: "Evening.",
      cluesRevealed: [],
    }, 2000);
    // Focus away with summary result
    state = applyFocus(
      state,
      { type: "FOCUS", target: { type: "location", id: "main-floor" } },
      {
        conversationEnded: {
          characterId: "tommy",
          summary: {
            topicsDiscussed: ["greeting"],
            informationRevealed: [],
            emotionalStateAfter: "calm",
            contradictionsExposed: [],
            cluesDiscovered: [],
          },
          informationSpread: { marlene: ["Investigator talked to Tommy"] },
          npcStateUpdates: { tommy: "nervous" },
          rapportDelta: 5,
        },
      },
      3000,
    );
    expect(getConversation(state, "tommy")!.summaries).toHaveLength(1);
    expect(state.npcStates["tommy"]!.emotion).toBe("nervous");
    expect(state.npcStates["marlene"]!.awareness).toContain("Investigator talked to Tommy");
  });

  it("does not mutate original state", () => {
    const state = freshState();
    applyFocus(state, { type: "FOCUS", target: { type: "location", id: "victors-office" } }, undefined, 1000);
    expect(state.focus.id).toBe("main-floor");
  });
});

// ---------------------------------------------------------------------------
// INTERACT — location (examine)
// ---------------------------------------------------------------------------

describe("applyInteract (location)", () => {
  it("logs exploration with no clue", () => {
    const next = applyInteract(
      freshState(),
      { type: "INTERACT", message: "the bar" },
      { context: "location", narrative: "A well-worn bar.", clueFound: null, matchedExaminable: null },
      1000,
    );
    expect(next.explorations).toHaveLength(1);
    expect(next.explorations[0]!.clueFound).toBeNull();
    expect(discoveredClueIds(next).size).toBe(0);
  });

  it("logs exploration with clue", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "location", id: "victors-office" },
    }, undefined, 1000);
    state = applyInteract(
      state,
      { type: "INTERACT", message: "the trash bin" },
      { context: "location", narrative: "A movie ticket stub.", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin" },
      2000,
    );
    expect(discoveredClueIds(state).has("clue-movie-stub")).toBe(true);
    expect(discoveredClues(state)).toHaveLength(1);
  });

  it("tracks visited locations", () => {
    let state = freshState();
    state = applyInteract(state, { type: "INTERACT", message: "look" }, {
      context: "location", narrative: "...", clueFound: null, matchedExaminable: null,
    }, 1000);
    state = applyFocus(state, { type: "FOCUS", target: { type: "location", id: "victors-office" } }, undefined, 2000);
    state = applyInteract(state, { type: "INTERACT", message: "look" }, {
      context: "location", narrative: "...", clueFound: null, matchedExaminable: null,
    }, 3000);
    expect(visitedLocationIds(state).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// INTERACT — character (speak)
// ---------------------------------------------------------------------------

describe("applyInteract (character)", () => {
  it("appends player + NPC messages", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    state = applyInteract(
      state,
      { type: "INTERACT", message: "Where were you?" },
      { context: "character", response: "Behind the bar.", cluesRevealed: [] },
      2000,
    );
    const convo = getConversation(state, "tommy");
    expect(convo!.messages).toHaveLength(2);
    expect(convo!.messages[0]!.role).toBe("player");
    expect(convo!.messages[1]!.role).toBe("npc");
  });

  it("tracks interviewed characters", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    state = applyFocus(state, { type: "FOCUS", target: { type: "character", id: "marlene" } }, undefined, 2000);
    expect(interviewedCharacterIds(state).size).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// SOLVE
// ---------------------------------------------------------------------------

describe("applySolve", () => {
  function stateWithClue(): GameState {
    return applyInteract(
      freshState(),
      { type: "INTERACT", message: "look" },
      { context: "location", narrative: "...", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin" },
      1000,
    );
  }

  it("handles solved outcome — game over", () => {
    const state = applySolve(
      stateWithClue(),
      {
        type: "SOLVE",
        answers: { "moment-murder": "Dolores swapped the glass" },
        evidenceCited: ["clue-movie-stub"],
      },
      {
        momentResults: [
          { momentId: "moment-murder", score: 1.0, feedback: "Exactly right." },
        ],
        score: 0.85,
        outcome: "solved",
        narrative: "The case is closed.",
        npcStateChanges: { dolores: "defeated" },
        gameOver: true,
      },
      2000,
    );
    expect(state.phase).toBe("solved");
    expect(state.theories).toHaveLength(1);
    expect(state.theories[0]!.outcome).toBe("solved");
    expect(state.npcStates["dolores"]!.emotion).toBe("defeated");
  });

  it("handles wrong outcome — game continues", () => {
    const state = applySolve(
      stateWithClue(),
      {
        type: "SOLVE",
        answers: { "moment-murder": "Frank did it" },
        evidenceCited: ["clue-movie-stub"],
      },
      {
        momentResults: [
          { momentId: "moment-murder", score: 0.1, feedback: "Wrong." },
        ],
        score: 0.2,
        outcome: "wrong",
        narrative: "Your theory doesn't hold up.",
        npcStateChanges: {},
        gameOver: false,
      },
      2000,
    );
    expect(state.phase).toBe("playing");
    expect(failedTheoryCount(state)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// GIVE_UP
// ---------------------------------------------------------------------------

describe("applyGiveUp", () => {
  it("sets phase to revealed", () => {
    const state = applyGiveUp(freshState(), { type: "GIVE_UP" }, undefined);
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
    const state = applyInteract(
      freshState(),
      { type: "INTERACT", message: "trash" },
      { context: "location", narrative: "...", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin" },
      1000,
    );
    expect(investigationProgress(state)).toBeCloseTo(1 / 6);
  });
});

// ---------------------------------------------------------------------------
// Event log
// ---------------------------------------------------------------------------

describe("deriveEventLog", () => {
  it("returns empty for fresh state", () => {
    expect(deriveEventLog(freshState())).toHaveLength(0);
  });

  it("creates entries for examinations", () => {
    const state = applyInteract(
      freshState(),
      { type: "INTERACT", message: "the bar" },
      { context: "location", narrative: "Nothing.", clueFound: null, matchedExaminable: null },
      1000,
    );
    const log = deriveEventLog(state);
    expect(log).toHaveLength(1);
    expect(log[0]!.type).toBe("examine");
  });

  it("distinguishes clue discovery", () => {
    const state = applyInteract(
      freshState(),
      { type: "INTERACT", message: "trash" },
      { context: "location", narrative: "Stub!", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin" },
      1000,
    );
    const log = deriveEventLog(state);
    expect(log[0]!.type).toBe("examine_clue");
    expect(log[0]!.icon).toBe("🔍");
  });
});

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

describe("serialize / deserialize", () => {
  it("round-trips a fresh state", () => {
    const state = freshState();
    const restored = deserialize(serialize(state));
    expect(restored.mystery.id).toBe(state.mystery.id);
    expect(restored.phase).toBe(state.phase);
  });

  it("preserves discovered clues", () => {
    const state = applyInteract(
      freshState(),
      { type: "INTERACT", message: "trash" },
      { context: "location", narrative: "...", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin" },
      1000,
    );
    const restored = deserialize(serialize(state));
    expect(discoveredClueIds(restored).has("clue-movie-stub")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Prerequisite filtering (clientAvailableExaminables)
// ---------------------------------------------------------------------------

describe("clientAvailableExaminables", () => {
  /** Build a minimal ClientGameState with one location that has two examinables:
   *  - "ex-open": no prerequisite (always available)
   *  - "ex-gated": requires "ex-open" to have been examined first
   */
  function makeClientState(): ClientGameState {
    const base = createGameState(mystery);
    const client = stripGameState(base);
    // Inject a synthetic location with prerequisite-gated examinables
    const syntheticLocation = {
      id: "test-room",
      name: "Test Room",
      description: "A room for testing.",
      examinables: [
        { id: "ex-open", name: "open thing", surfaceDetail: "visible", prerequisite: null },
        { id: "ex-gated", name: "gated thing", surfaceDetail: "hidden", prerequisite: "ex-open" },
      ],
      charactersPresent: [],
    };
    return {
      ...client,
      mystery: {
        ...client.mystery,
        locations: [...client.mystery.locations, syntheticLocation],
      },
    };
  }

  it("returns only prerequisite-free examinables initially", () => {
    const state = makeClientState();
    const available = clientAvailableExaminables(state, "test-room");
    expect(available.map((e) => e.id)).toEqual(["ex-open"]);
  });

  it("unlocks gated examinable after prerequisite is examined", () => {
    const state = makeClientState();
    // Simulate having examined "ex-open" at "test-room"
    const stateWithExploration: ClientGameState = {
      ...state,
      explorations: [
        ...state.explorations,
        {
          locationId: "test-room",
          query: "the open thing",
          clueFound: null,
          examinableId: "ex-open",
          narrative: "Nothing special.",
          timestamp: 1000,
        },
      ],
    };
    const available = clientAvailableExaminables(stateWithExploration, "test-room");
    expect(available.map((e) => e.id)).toContain("ex-open");
    expect(available.map((e) => e.id)).toContain("ex-gated");
    expect(available).toHaveLength(2);
  });

  it("returns empty array for unknown location", () => {
    const state = makeClientState();
    expect(clientAvailableExaminables(state, "nonexistent-room")).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Rapport initialization
// ---------------------------------------------------------------------------

describe("createGameState rapport initialization", () => {
  it("initializes suspects with rapport 40", () => {
    const state = createGameState(mystery);
    const suspects = mystery.characters.filter((c) => c.role === "suspect");
    for (const suspect of suspects) {
      expect(state.npcStates[suspect.id]!.rapport).toBe(40);
    }
  });

  it("initializes narrator with rapport 100", () => {
    // Build a minimal mystery with a narrator character
    const narratorMystery: Mystery = {
      ...mystery,
      id: "narrator-test",
      characters: [
        ...mystery.characters,
        {
          id: "detective-malone",
          name: "Detective Malone",
          description: "The narrator.",
          personality: "Gruff but fair.",
          speechPattern: "Terse.",
          role: "narrator",
          interests: ["the case"],
          dismissiveOf: [],
          motive: "Justice.",
          alibi: { claimed: "On duty.", truth: "On duty.", gaps: [] },
          meansAccess: false,
          opportunityWindow: "N/A",
          whatTheySaw: [],
          whatTheyKnow: [],
          whatTheySuspect: "Unknown.",
          secret: { description: "None.", reason: "N/A", revealTrigger: "N/A" },
          relationships: {},
          isGuilty: false,
        },
      ],
    };
    const state = createGameState(narratorMystery);
    expect(state.npcStates["detective-malone"]!.rapport).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Narrator initial focus
// ---------------------------------------------------------------------------

describe("createGameState narrator focus", () => {
  it("focuses on narrator when mystery has one", () => {
    const narratorMystery: Mystery = {
      ...mystery,
      id: "narrator-focus-test",
      characters: [
        ...mystery.characters,
        {
          id: "detective-malone",
          name: "Detective Malone",
          description: "The narrator.",
          personality: "Gruff but fair.",
          speechPattern: "Terse.",
          role: "narrator",
          interests: ["the case"],
          dismissiveOf: [],
          motive: "Justice.",
          alibi: { claimed: "On duty.", truth: "On duty.", gaps: [] },
          meansAccess: false,
          opportunityWindow: "N/A",
          whatTheySaw: [],
          whatTheyKnow: [],
          whatTheySuspect: "Unknown.",
          secret: { description: "None.", reason: "N/A", revealTrigger: "N/A" },
          relationships: {},
          isGuilty: false,
        },
      ],
    };
    const state = createGameState(narratorMystery);
    expect(state.focus).toEqual({ type: "character", id: "detective-malone" });
  });

  it("focuses on first location when no narrator", () => {
    // Blue Parrot has no narrator — all suspects
    const state = createGameState(mystery);
    expect(state.focus).toEqual({ type: "location", id: "main-floor" });
  });
});

// ---------------------------------------------------------------------------
// stripToListItem
// ---------------------------------------------------------------------------

describe("stripToListItem", () => {
  it("returns only the catalog fields", () => {
    const item = stripToListItem(mystery);
    expect(item.id).toBe(mystery.id);
    expect(item.title).toBe(mystery.title);
    expect(item.genre).toBe(mystery.genre);
    expect(item.difficulty).toBe(mystery.difficulty);
    expect(item.description).toBe(mystery.description);
    expect(item.setting).toEqual(mystery.setting);
  });

  it("does not include characters, locations, clues, or solution", () => {
    const item = stripToListItem(mystery) as unknown as Record<string, unknown>;
    expect(item["characters"]).toBeUndefined();
    expect(item["locations"]).toBeUndefined();
    expect(item["clues"]).toBeUndefined();
    expect(item["solution"]).toBeUndefined();
    expect(item["contradictions"]).toBeUndefined();
    expect(item["redHerrings"]).toBeUndefined();
    expect(item["timeline"]).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// Rapport delta in reducer (applyFocus with rapportDelta)
// ---------------------------------------------------------------------------

describe("applyFocus rapportDelta", () => {
  it("updates rapport when leaving a character conversation", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    state = applyInteract(state, { type: "INTERACT", message: "Hello" }, {
      context: "character",
      response: "Evening.",
      cluesRevealed: [],
    }, 2000);
    // Leave with rapportDelta: 10 (40 → 50)
    state = applyFocus(
      state,
      { type: "FOCUS", target: { type: "location", id: "main-floor" } },
      {
        conversationEnded: {
          characterId: "tommy",
          summary: {
            topicsDiscussed: ["greeting"],
            informationRevealed: [],
            emotionalStateAfter: "calm",
            contradictionsExposed: [],
            cluesDiscovered: [],
          },
          informationSpread: {},
          npcStateUpdates: {},
          rapportDelta: 10,
        },
      },
      3000,
    );
    expect(state.npcStates["tommy"]!.rapport).toBe(50);
  });

  it("clamps rapport at 100 when rapportDelta would exceed it", () => {
    let state = applyFocus(freshState(), {
      type: "FOCUS",
      target: { type: "character", id: "tommy" },
    }, undefined, 1000);
    state = applyInteract(state, { type: "INTERACT", message: "Hello" }, {
      context: "character",
      response: "Evening.",
      cluesRevealed: [],
    }, 2000);
    // rapportDelta: 200 should cap at 100
    state = applyFocus(
      state,
      { type: "FOCUS", target: { type: "location", id: "main-floor" } },
      {
        conversationEnded: {
          characterId: "tommy",
          summary: {
            topicsDiscussed: ["greeting"],
            informationRevealed: [],
            emotionalStateAfter: "calm",
            contradictionsExposed: [],
            cluesDiscovered: [],
          },
          informationSpread: {},
          npcStateUpdates: {},
          rapportDelta: 200,
        },
      },
      3000,
    );
    expect(state.npcStates["tommy"]!.rapport).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Full evidence chain scenario
// ---------------------------------------------------------------------------

describe("full evidence chain", () => {
  it("discovers all 4 chain clues and solves the mystery", () => {
    let state = freshState();

    // Move to office, find 2 clues
    state = applyFocus(state, { type: "FOCUS", target: { type: "location", id: "victors-office" } }, undefined, 1000);
    state = applyInteract(state, { type: "INTERACT", message: "the trash bin" }, {
      context: "location", narrative: "Movie stub...", clueFound: "clue-movie-stub", matchedExaminable: "ex-trash-bin",
    }, 2000);
    state = applyInteract(state, { type: "INTERACT", message: "the air" }, {
      context: "location", narrative: "Shalimar...", clueFound: "clue-perfume", matchedExaminable: "ex-office-air",
    }, 3000);

    // Move to alley, find 1 clue
    state = applyFocus(state, { type: "FOCUS", target: { type: "location", id: "back-alley" } }, undefined, 4000);
    state = applyInteract(state, { type: "INTERACT", message: "the dumpster" }, {
      context: "location", narrative: "Rat poison receipt...", clueFound: "clue-rat-poison", matchedExaminable: "ex-dumpster",
    }, 5000);

    // Talk to Eddie, get testimonial clue via summary
    state = applyFocus(state, { type: "FOCUS", target: { type: "character", id: "eddie" } }, undefined, 6000);
    state = applyInteract(state, { type: "INTERACT", message: "Tell me about Dolores" }, {
      context: "character", response: "She asked about insurance...", cluesRevealed: ["clue-insurance"],
    }, 7000);
    state = applyFocus(
      state,
      { type: "FOCUS", target: { type: "location", id: "main-floor" } },
      {
        conversationEnded: {
          characterId: "eddie",
          summary: {
            topicsDiscussed: ["Dolores", "insurance"],
            informationRevealed: ["Dolores researched insurance"],
            emotionalStateAfter: "anxious",
            contradictionsExposed: [],
            cluesDiscovered: ["clue-insurance"],
          },
          informationSpread: {},
          npcStateUpdates: { eddie: "anxious" },
          rapportDelta: 10,
        },
      },
      8000,
    );

    // Verify all 4 chain clues found
    const found = discoveredClueIds(state);
    expect(found.has("clue-movie-stub")).toBe(true);
    expect(found.has("clue-perfume")).toBe(true);
    expect(found.has("clue-rat-poison")).toBe(true);
    expect(found.has("clue-insurance")).toBe(true);
    expect(investigationProgress(state)).toBeCloseTo(4 / 6);

    // Solve
    state = applySolve(
      state,
      {
        type: "SOLVE",
        answers: {
          "moment-break": "Eddie called Dolores. Tommy was in the stockroom. Dolores drove to the club.",
          "moment-murder": "Dolores entered through the back alley, went up the back stairs, and swapped Victor's whiskey glass with poisoned one.",
          "moment-death": "Victor drank the poisoned whiskey and died.",
          "moment-frank-visit": "Frank went upstairs to threaten Victor about debt, found him dead, wiped down surfaces.",
        },
        evidenceCited: [...found],
      },
      {
        momentResults: [
          { momentId: "moment-break", score: 0.9, feedback: "Correct." },
          { momentId: "moment-murder", score: 1.0, feedback: "Exactly right." },
          { momentId: "moment-death", score: 0.8, feedback: "Got the key fact." },
          { momentId: "moment-frank-visit", score: 0.9, feedback: "Correct." },
        ],
        score: 0.91,
        outcome: "solved",
        narrative: "The pieces lock into place.",
        npcStateChanges: { dolores: "defeated", eddie: "devastated" },
        gameOver: true,
      },
      9000,
    );

    expect(state.phase).toBe("solved");
    expect(state.theories).toHaveLength(1);
    expect(state.theories[0]!.score).toBeCloseTo(0.91);

    const log = deriveEventLog(state);
    expect(log.length).toBeGreaterThanOrEqual(5);
    expect(log[log.length - 1]!.type).toBe("theory_solved");
  });
});
