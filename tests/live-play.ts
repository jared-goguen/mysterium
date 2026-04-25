/**
 * live-play.ts — End-to-end test against live Claude API
 *
 * Plays through the Blue Parrot mystery exercising every engine:
 *   Examiner (4 examinations, 3 with clues + 1 without)
 *   Conversant (2 messages to Eddie, streaming)
 *   Summarizer (end conversation)
 *   Judge (accusation)
 *
 * Run:  bun run tests/live-play.ts
 * Cost: ~$0.02-0.05 per run (Haiku + Sonnet 4.5)
 */

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
} from "../lib/reducer";
import {
  discoveredClueIds,
  investigationProgress,
  getConversation,
} from "../types/state";
import { deriveEventLog } from "../lib/events";
import { createClient } from "../lib/ai/client";
import { examine } from "../lib/ai/engines/examiner";
import { converse } from "../lib/ai/engines/conversant";
import { summarize } from "../lib/ai/engines/summarizer";
import { evaluate } from "../lib/ai/engines/judge";
import type { GameState } from "../types/state";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DIVIDER = "─".repeat(60);

function header(text: string) {
  console.log(`\n${DIVIDER}`);
  console.log(`  ${text}`);
  console.log(DIVIDER);
}

function check(label: string, pass: boolean) {
  console.log(`  ${pass ? "✅" : "❌"} ${label}`);
}

function validateOrDie(state: GameState, action: any) {
  const v = validateAction(state, action);
  if (!v.valid) {
    console.error(`❌ Validation failed: ${v.reason}`);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const client = createClient();
  let state = createGameState(mystery);

  console.log(`\n🔍 MYSTERIUM — Live Play Test`);
  console.log(`   Mystery: ${mystery.title}`);
  console.log(`   Genre:   ${mystery.genre}`);
  console.log(`   Setting: ${mystery.setting.name}, ${mystery.setting.era}\n`);

  // -----------------------------------------------------------------------
  // Step 1: Move to Victor's Office
  // -----------------------------------------------------------------------
  header("1. MOVE → Victor's Office");
  const moveAction = { type: "MOVE" as const, locationId: "victors-office" };
  validateOrDie(state, moveAction);
  state = applyMove(state, moveAction);
  console.log(`  📍 Now at: ${state.focus.id}`);

  // -----------------------------------------------------------------------
  // Step 2: Examine the waste bin (should find clue-movie-stub)
  // -----------------------------------------------------------------------
  header("2. EXAMINE → the waste bin");
  const examAction1 = {
    type: "EXAMINE" as const,
    locationId: "victors-office",
    query: "the waste bin",
  };
  validateOrDie(state, examAction1);

  const examResult1 = await examine(client, state, examAction1);
  console.log(`\n  Narrative:\n${indent(examResult1.narrative)}`);
  console.log(`\n  Clue found: ${examResult1.clueFound ?? "none"}`);
  check("Found clue-movie-stub", examResult1.clueFound === "clue-movie-stub");

  state = applyExamine(state, examAction1, examResult1);

  // -----------------------------------------------------------------------
  // Step 3: Examine the air (should find clue-perfume)
  // -----------------------------------------------------------------------
  header("3. EXAMINE → the air in the room");
  const examAction2 = {
    type: "EXAMINE" as const,
    locationId: "victors-office",
    query: "the air in the room",
  };
  validateOrDie(state, examAction2);

  const examResult2 = await examine(client, state, examAction2);
  console.log(`\n  Narrative:\n${indent(examResult2.narrative)}`);
  console.log(`\n  Clue found: ${examResult2.clueFound ?? "none"}`);
  check("Found clue-perfume", examResult2.clueFound === "clue-perfume");

  state = applyExamine(state, examAction2, examResult2);

  // -----------------------------------------------------------------------
  // Step 4: Move to Back Alley + examine dumpster (clue-rat-poison)
  // -----------------------------------------------------------------------
  header("4. MOVE → Back Alley, EXAMINE → the dumpster");
  state = applyMove(state, { type: "MOVE", locationId: "back-alley" });

  const examAction3 = {
    type: "EXAMINE" as const,
    locationId: "back-alley",
    query: "the dumpster",
  };
  validateOrDie(state, examAction3);

  const examResult3 = await examine(client, state, examAction3);
  console.log(`\n  Narrative:\n${indent(examResult3.narrative)}`);
  console.log(`\n  Clue found: ${examResult3.clueFound ?? "none"}`);
  check("Found clue-rat-poison", examResult3.clueFound === "clue-rat-poison");

  state = applyExamine(state, examAction3, examResult3);

  // -----------------------------------------------------------------------
  // Step 5: Examine fire escape (no clue expected)
  // -----------------------------------------------------------------------
  header("5. EXAMINE → the fire escape (expect NO clue)");
  const examAction4 = {
    type: "EXAMINE" as const,
    locationId: "back-alley",
    query: "the fire escape",
  };
  validateOrDie(state, examAction4);

  const examResult4 = await examine(client, state, examAction4);
  console.log(`\n  Narrative:\n${indent(examResult4.narrative)}`);
  console.log(`\n  Clue found: ${examResult4.clueFound ?? "none"}`);
  check("No clue found", examResult4.clueFound === null);

  state = applyExamine(state, examAction4, examResult4);

  // -----------------------------------------------------------------------
  // Step 6: Talk to Eddie
  // -----------------------------------------------------------------------
  header("6. TALK → Eddie Sato");
  const talkAction = { type: "TALK" as const, characterId: "eddie" };
  validateOrDie(state, talkAction);
  state = applyTalk(state, talkAction);

  // -----------------------------------------------------------------------
  // Step 7: SAY — ask about Dolores (streaming)
  // -----------------------------------------------------------------------
  header("7. SAY → 'What do you know about Dolores?'");
  const sayAction1 = {
    type: "SAY" as const,
    characterId: "eddie",
    message: "What do you know about Dolores Morel? I need you to be honest with me.",
  };
  validateOrDie(state, sayAction1);

  process.stdout.write("\n  Eddie: ");
  const sayResult1 = await converse(client, state, sayAction1, (delta) => {
    process.stdout.write(delta);
  });
  console.log(`\n\n  Clues revealed: ${sayResult1.cluesRevealed.length > 0 ? sayResult1.cluesRevealed.join(", ") : "none"}`);

  state = applySay(state, sayAction1, sayResult1);

  // -----------------------------------------------------------------------
  // Step 8: SAY — press about insurance (should reveal clue-insurance)
  // -----------------------------------------------------------------------
  header("8. SAY → 'Did she ask about Victor's life insurance?'");
  const sayAction2 = {
    type: "SAY" as const,
    characterId: "eddie",
    message:
      "Eddie, I know you two are close. Did Dolores ever ask you about Victor's life insurance policy? How much it paid out? Whether it covered unnatural death?",
  };
  validateOrDie(state, sayAction2);

  process.stdout.write("\n  Eddie: ");
  const sayResult2 = await converse(client, state, sayAction2, (delta) => {
    process.stdout.write(delta);
  });
  console.log(`\n\n  Clues revealed: ${sayResult2.cluesRevealed.length > 0 ? sayResult2.cluesRevealed.join(", ") : "none"}`);
  check(
    "Revealed clue-insurance",
    sayResult2.cluesRevealed.includes("clue-insurance"),
  );

  state = applySay(state, sayAction2, sayResult2);

  // -----------------------------------------------------------------------
  // Step 9: END_CONVERSATION — summarize
  // -----------------------------------------------------------------------
  header("9. END_CONVERSATION → summarize Eddie conversation");
  const endAction = {
    type: "END_CONVERSATION" as const,
    characterId: "eddie",
  };
  validateOrDie(state, endAction);

  const endResult = await summarize(client, state, endAction);
  console.log(`\n  Topics: ${endResult.summary.topicsDiscussed.join(", ")}`);
  console.log(`  Revealed: ${endResult.summary.informationRevealed.join(", ")}`);
  console.log(`  Emotional state: ${endResult.summary.emotionalStateAfter}`);
  console.log(`  Clues discovered: ${endResult.summary.cluesDiscovered.join(", ") || "none"}`);
  console.log(`  Contradictions: ${endResult.summary.contradictionsExposed.join(", ") || "none"}`);
  console.log(`  Info spread: ${JSON.stringify(endResult.informationSpread)}`);
  console.log(`  NPC updates: ${JSON.stringify(endResult.npcStateUpdates)}`);

  state = applyEndConversation(state, endAction, endResult);

  // -----------------------------------------------------------------------
  // Step 10: ACCUSE Dolores
  // -----------------------------------------------------------------------
  header("10. ACCUSE → Dolores Morel");
  const found = discoveredClueIds(state);
  console.log(`  Clues in hand: ${[...found].join(", ")}`);
  console.log(`  Progress: ${(investigationProgress(state) * 100).toFixed(0)}%`);

  const accuseAction = {
    type: "ACCUSE" as const,
    suspectId: "dolores",
    motive:
      "Insurance payout and freedom — Dolores wanted out of a controlling marriage and stood to gain $50,000 from Victor's death.",
    method:
      "She laced a flask of whiskey with cyanide from rat poison purchased three days before. During the second set, she slipped in through the back alley, swapped Victor's glass, and left unseen.",
    evidenceCited: [...found],
  };
  validateOrDie(state, accuseAction);

  const accuseResult = await evaluate(client, state, accuseAction);
  console.log(`\n  Outcome: ${accuseResult.outcome}`);
  console.log(`  Game over: ${accuseResult.consequence.gameOver}`);
  console.log(`\n  Narrative:\n${indent(accuseResult.consequence.narrative)}`);
  console.log(`\n  NPC reactions: ${JSON.stringify(accuseResult.consequence.npcStateChanges)}`);
  console.log(`  Secrets revealed: ${accuseResult.consequence.secretsRevealed.join(", ") || "none"}`);
  check("Outcome is correct", accuseResult.outcome === "correct");
  check("Game over", accuseResult.consequence.gameOver === true);

  state = applyAccuse(state, accuseAction, accuseResult);

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  header("GAME SUMMARY");
  console.log(`  Phase: ${state.phase}`);
  console.log(`  Clues found: ${discoveredClueIds(state).size} / ${mystery.clues.length}`);
  console.log(`  Locations visited: ${new Set(state.explorations.map((e) => e.locationId)).size}`);
  console.log(`  Conversations: ${state.conversations.length}`);
  console.log(`  Accusations: ${state.accusations.length}`);

  header("EVENT LOG");
  for (const entry of deriveEventLog(state)) {
    console.log(`  ${entry.icon} ${entry.description}`);
  }

  // Count passes/fails
  const checks = [
    examResult1.clueFound === "clue-movie-stub",
    examResult2.clueFound === "clue-perfume",
    examResult3.clueFound === "clue-rat-poison",
    examResult4.clueFound === null,
    sayResult2.cluesRevealed.includes("clue-insurance"),
    accuseResult.outcome === "correct",
    accuseResult.consequence.gameOver === true,
  ];
  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  console.log(`\n${DIVIDER}`);
  console.log(`  ${passed === total ? "🎉" : "⚠️"} ${passed}/${total} checks passed`);
  console.log(DIVIDER);

  process.exit(passed === total ? 0 : 1);
}

function indent(text: string, prefix = "    "): string {
  return text
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
