/**
 * live-play.ts — End-to-end test against live Claude API
 *
 * Plays through Blue Parrot using the 4-action model:
 *   FOCUS + INTERACT (examine), FOCUS + INTERACT (speak),
 *   auto-summarize on FOCUS away, SOLVE
 *
 * Run:  bun run tests/live-play.ts
 * Cost: ~$0.03-0.05 per run
 */

import mystery from "../examples/blue-parrot";
import { createGameState } from "../lib/initializers";
import { validateAction } from "../lib/validators";
import { applyFocus, applyInteract, applySolve } from "../lib/reducer";
import { discoveredClueIds, investigationProgress } from "../types/state";
import { deriveEventLog } from "../lib/events";
import { createClient } from "../lib/ai/client";
import { examine } from "../lib/ai/engines/examiner";
import { converse } from "../lib/ai/engines/conversant";
import { summarize } from "../lib/ai/engines/summarizer";
import { evaluate } from "../lib/ai/engines/judge";
import type { GameState } from "../types/state";
import type { FocusAction, InteractAction } from "../types/actions";

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

function indent(text: string, prefix = "    "): string {
  return text.split("\n").map((l) => prefix + l).join("\n");
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
  // 1. FOCUS → Victor's Office
  // -----------------------------------------------------------------------
  header("1. FOCUS → Victor's Office");
  state = applyFocus(state, { type: "FOCUS", target: { type: "location", id: "victors-office" } });
  console.log(`  📍 Now at: ${state.focus.id}`);

  // -----------------------------------------------------------------------
  // 2. INTERACT → examine the waste bin (expect clue-movie-stub)
  // -----------------------------------------------------------------------
  header("2. INTERACT → the waste bin");
  const interact1: InteractAction = { type: "INTERACT", message: "the waste bin" };
  validateOrDie(state, interact1);

  const result1 = await examine(client, state, interact1);
  console.log(`\n  Narrative:\n${indent(result1.narrative)}`);
  console.log(`\n  Clue found: ${result1.clueFound ?? "none"}`);
  check("Found clue-movie-stub", result1.clueFound === "clue-movie-stub");
  state = applyInteract(state, interact1, result1);

  // -----------------------------------------------------------------------
  // 3. INTERACT → examine the air (expect clue-perfume)
  // -----------------------------------------------------------------------
  header("3. INTERACT → the air in the room");
  const interact2: InteractAction = { type: "INTERACT", message: "the air in the room" };
  const result2 = await examine(client, state, interact2);
  console.log(`\n  Narrative:\n${indent(result2.narrative)}`);
  console.log(`\n  Clue found: ${result2.clueFound ?? "none"}`);
  check("Found clue-perfume", result2.clueFound === "clue-perfume");
  state = applyInteract(state, interact2, result2);

  // -----------------------------------------------------------------------
  // 4. FOCUS → Back Alley, INTERACT → dumpster (expect clue-rat-poison)
  // -----------------------------------------------------------------------
  header("4. FOCUS → Back Alley, INTERACT → the dumpster");
  state = applyFocus(state, { type: "FOCUS", target: { type: "location", id: "back-alley" } });

  const interact3: InteractAction = { type: "INTERACT", message: "the dumpster" };
  const result3 = await examine(client, state, interact3);
  console.log(`\n  Narrative:\n${indent(result3.narrative)}`);
  console.log(`\n  Clue found: ${result3.clueFound ?? "none"}`);
  check("Found clue-rat-poison", result3.clueFound === "clue-rat-poison");
  state = applyInteract(state, interact3, result3);

  // -----------------------------------------------------------------------
  // 5. INTERACT → fire escape (expect NO clue)
  // -----------------------------------------------------------------------
  header("5. INTERACT → the fire escape (expect NO clue)");
  const interact4: InteractAction = { type: "INTERACT", message: "the fire escape" };
  const result4 = await examine(client, state, interact4);
  console.log(`\n  Narrative:\n${indent(result4.narrative)}`);
  console.log(`\n  Clue found: ${result4.clueFound ?? "none"}`);
  check("No clue found", result4.clueFound === null);
  state = applyInteract(state, interact4, result4);

  // -----------------------------------------------------------------------
  // 6. FOCUS → Eddie (conversation)
  // -----------------------------------------------------------------------
  header("6. FOCUS → Eddie Sato");
  state = applyFocus(state, { type: "FOCUS", target: { type: "character", id: "eddie" } });

  // -----------------------------------------------------------------------
  // 7. INTERACT → ask about Dolores (streaming)
  // -----------------------------------------------------------------------
  header("7. INTERACT → 'What do you know about Dolores?'");
  const speak1: InteractAction = {
    type: "INTERACT",
    message: "What do you know about Dolores Morel? I need you to be honest with me.",
  };
  validateOrDie(state, speak1);

  process.stdout.write("\n  Eddie: ");
  const speakResult1 = await converse(client, state, speak1, (delta) => {
    process.stdout.write(delta);
  });
  console.log(`\n\n  Clues revealed: ${speakResult1.cluesRevealed.length > 0 ? speakResult1.cluesRevealed.join(", ") : "none"}`);
  state = applyInteract(state, speak1, speakResult1);

  // -----------------------------------------------------------------------
  // 8. INTERACT → press about insurance (should reveal clue-insurance)
  // -----------------------------------------------------------------------
  header("8. INTERACT → 'Did she ask about Victor's life insurance?'");
  const speak2: InteractAction = {
    type: "INTERACT",
    message: "Eddie, I know you two are close. Did Dolores ever ask you about Victor's life insurance policy? How much it paid out? Whether it covered unnatural death?",
  };

  process.stdout.write("\n  Eddie: ");
  const speakResult2 = await converse(client, state, speak2, (delta) => {
    process.stdout.write(delta);
  });
  console.log(`\n\n  Clues revealed: ${speakResult2.cluesRevealed.length > 0 ? speakResult2.cluesRevealed.join(", ") : "none"}`);
  check("Revealed clue-insurance", speakResult2.cluesRevealed.includes("clue-insurance"));
  state = applyInteract(state, speak2, speakResult2);

  // -----------------------------------------------------------------------
  // 9. FOCUS away → auto-summarize conversation
  // -----------------------------------------------------------------------
  header("9. FOCUS → Main Floor (auto-summarize Eddie conversation)");
  const summaryResult = await summarize(client, state, "eddie");
  console.log(`\n  Topics: ${summaryResult.summary.topicsDiscussed.join(", ")}`);
  console.log(`  Revealed: ${summaryResult.summary.informationRevealed.join(", ")}`);
  console.log(`  Emotional state: ${summaryResult.summary.emotionalStateAfter}`);
  console.log(`  Info spread: ${JSON.stringify(summaryResult.informationSpread)}`);

  state = applyFocus(
    state,
    { type: "FOCUS", target: { type: "location", id: "main-floor" } },
    { conversationEnded: summaryResult },
  );

  // -----------------------------------------------------------------------
  // 10. SOLVE — reconstruct the timeline
  // -----------------------------------------------------------------------
  header("10. SOLVE → reconstruct the timeline");
  const found = discoveredClueIds(state);
  console.log(`  Clues in hand: ${[...found].join(", ")}`);
  console.log(`  Progress: ${(investigationProgress(state) * 100).toFixed(0)}%`);

  const solveAction = {
    type: "SOLVE" as const,
    answers: {
      "moment-break": "Eddie stepped outside and called Dolores on the phone. She told him she was coming to the club. Tommy went to the stockroom. Dolores parked her car a block away.",
      "moment-murder": "Dolores entered through the back alley door and climbed the back stairs to Victor's office while the second set covered the noise. She swapped Victor's whiskey glass with a flask of cyanide-laced whiskey she had prepared, then left the same way.",
      "moment-death": "Victor drank the poisoned whiskey. The cyanide killed him within minutes. He died alone at his desk.",
      "moment-frank-visit": "Frank Palazzo went upstairs to threaten Victor about the gambling debt. He found Victor dead, panicked, and wiped down every surface he had touched to remove his fingerprints — contaminating the crime scene.",
    },
    evidenceCited: [...found],
  };
  validateOrDie(state, solveAction);

  const solveResult = await evaluate(client, state, solveAction);
  console.log(`\n  Outcome: ${solveResult.outcome}`);
  console.log(`  Score: ${Math.round(solveResult.score * 100)}%`);
  console.log(`  Game over: ${solveResult.gameOver}`);

  console.log(`\n  Per-moment results:`);
  for (const mr of solveResult.momentResults) {
    const icon = mr.score >= 0.7 ? "✅" : mr.score >= 0.4 ? "🟡" : "❌";
    console.log(`    ${icon} ${mr.momentId}: ${Math.round(mr.score * 100)}% — ${mr.feedback}`);
  }

  console.log(`\n  Narrative:\n${indent(solveResult.narrative)}`);
  check("Outcome is solved", solveResult.outcome === "solved");
  check("Game over", solveResult.gameOver === true);

  state = applySolve(state, solveAction, solveResult);

  // -----------------------------------------------------------------------
  // Summary
  // -----------------------------------------------------------------------
  header("GAME SUMMARY");
  console.log(`  Phase: ${state.phase}`);
  console.log(`  Clues found: ${discoveredClueIds(state).size} / ${mystery.clues.length}`);
  console.log(`  Locations visited: ${new Set(state.explorations.map((e) => e.locationId)).size}`);
  console.log(`  Conversations: ${state.conversations.length}`);
  console.log(`  Theories: ${state.theories.length}`);

  header("EVENT LOG");
  for (const entry of deriveEventLog(state)) {
    console.log(`  ${entry.icon} ${entry.description}`);
  }

  const checks = [
    result1.clueFound === "clue-movie-stub",
    result2.clueFound === "clue-perfume",
    result3.clueFound === "clue-rat-poison",
    result4.clueFound === null,
    speakResult2.cluesRevealed.includes("clue-insurance"),
    solveResult.outcome === "solved",
    solveResult.gameOver === true,
  ];
  const passed = checks.filter(Boolean).length;
  const total = checks.length;

  console.log(`\n${DIVIDER}`);
  console.log(`  ${passed === total ? "🎉" : "⚠️"} ${passed}/${total} checks passed`);
  console.log(DIVIDER);

  process.exit(passed === total ? 0 : 1);
}

main().catch((err) => {
  console.error("\n💥 Fatal error:", err);
  process.exit(1);
});
