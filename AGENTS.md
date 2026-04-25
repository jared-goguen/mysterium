# Mysterium — Agent Guide

Read [DESIGN.md](DESIGN.md) first for the game design rationale.

## What This Is

An AI-powered interactive mystery game. Players explore locations, interrogate suspects, discover clues, and reconstruct the timeline of events. The AI powers every NPC interaction, examination narrative, and solution evaluation.

The core mechanic: a mystery is a **broken timeline**. The player fills in the gaps.

## Architecture

Three layers, strict separation:

| Layer | Path | Purity | What it does |
|---|---|---|---|
| **Types** | `types/` | Pure contracts | Mystery, GameState, Actions — the schema for everything |
| **Lib** | `lib/` | Game logic | State machine (pure) + AI engines (impure) |
| **UI** | `src/` | React | Components, hooks, styles — renders state, dispatches actions |
| **API** | `functions/` | Hono on Workers | HTTP routes connecting UI to AI engines |

### The Two Objects

**Mystery** (`types/mystery.ts`) — immutable world. Characters, locations, examinables, clues, contradictions, timeline, and a solution defined as **moments** (known events + hidden gaps). Never mutated after creation.

**GameState** (`types/state.ts`) — mutable player journey. Three append-only logs (explorations, conversations, theories) + cached NPC states + current focus. Derived state computed via pure functions.

### State Machine

`lib/reducer.ts` is the core. Pattern: `apply*(state, action, aiResult) → newState`. Individual typed functions per action, plus a general `reduce()` dispatcher. The reducer never calls AI — that separation is the caller's responsibility.

`lib/validators.ts` checks preconditions before any action is dispatched.

`lib/events.ts` derives a chronological event log from state (for the UI's left panel).

### AI Engines

All in `lib/ai/`. Four play-cycle engines:

| Engine | File | Model | Trigger |
|---|---|---|---|
| Examiner | `engines/examiner.ts` | Haiku 4.5 | EXAMINE action |
| Conversant | `engines/conversant.ts` | Sonnet 4.5 (streaming) + Haiku 4.5 (clue detection) | SAY action |
| Summarizer | `engines/summarizer.ts` | Haiku 4.5 | END_CONVERSATION action |
| Judge | `engines/judge.ts` | Sonnet 4.5 | SOLVE / GIVE_UP action |

Each engine has three sub-layers:
- **Context** (`context.ts`) — selects relevant state slice for the prompt
- **Prompt** (`prompts/*.ts`) — pure function building system prompt + user message
- **Engine** (`engines/*.ts`) — calls Claude, validates response, returns typed result

All structured output uses Claude tool_use. Model routing is in `client.ts`: `fast` tier = Haiku, `quality` tier = Sonnet.

### API Routes

`functions/api/[[route]].ts` — Hono catch-all with endpoints:

```
POST /api/examine    → ExamineResult (JSON)
POST /api/chat       → SayResult (SSE stream: delta + done events)
POST /api/summarize  → EndConversationResult (JSON)
POST /api/solve      → SolveResult (JSON)
POST /api/give-up    → GiveUpResult (JSON)
```

Each route: parse body → validate action → call engine → return result. Game state travels with each request (stateless server). API key from Workers env bindings.

### React Hooks

Two hooks with the same interface (components don't know which is active):

- `src/hooks/useGameState.ts` — real: calls API routes, SSE streaming, async
- `src/hooks/useMockGameState.ts` — mock: local fuzzy matching, synchronous

Toggle in `src/App.tsx` by changing the import.

### Solving a Mystery

The endgame is **timeline reconstruction**, not accusation. The mystery defines moments (known + gaps). The player fills in the gaps with freeform text. The AI evaluates each gap answer against structured ground truth, producing per-moment scores and an overall weighted score.

Outcomes: **solved** (≥ 0.75), **close** (0.4–0.75), **wrong** (< 0.4).

Wrong attempts have NPC consequences but the game continues. See [DESIGN.md](DESIGN.md) for the full rationale.

### Example Mystery

`examples/blue-parrot.ts` — complete noir mystery. 5 characters, 4 locations, 6 clues, 3 contradictions, 2 red herrings. Timeline with 4 known moments and 4 gaps. Used as the test fixture everywhere. Type-checked against the Mystery schema.

## Key Files

| When you need to... | Look at... |
|---|---|
| Understand the game design | `DESIGN.md` |
| Understand the data model | `types/mystery.ts`, `types/state.ts`, `types/actions.ts` |
| Change game logic | `lib/reducer.ts`, `lib/validators.ts` |
| Change AI behavior | `lib/ai/prompts/*.ts` (prompts) or `lib/ai/engines/*.ts` (wiring) |
| Change what context the AI sees | `lib/ai/context.ts` |
| Add a new API route | `functions/api/[[route]].ts` |
| Change UI layout | `src/components/GameBoard.tsx` |
| Change how a panel works | `src/components/{EventLog,LocationView,ChatPanel,NotesPanel}.tsx` |
| Change the solve flow | `src/components/SolutionModal.tsx` |
| Add a new mystery | `examples/` — export a `Mystery` object |

## Commands

```bash
bun install                        # install deps
bun test                           # unit tests (state machine)
bun run typecheck                  # TypeScript strict
bun run tests/live-play.ts         # live API test (~$0.03)
bunx vite                          # dev server (mock mode)
wrangler pages dev -- bunx vite    # dev server (real AI)
bunx vite build                    # production build
wrangler pages deploy dist         # deploy
```

## Constraints

- **Never mutate Mystery** after creation. It's the ground truth.
- **State transitions go through the reducer.** Don't modify GameState directly in hooks or components.
- **AI engines validate all IDs.** If Claude returns a clue/character/contradiction ID that doesn't exist in the mystery, it's logged and discarded. Never trust AI output without validation.
- **Prompts are pure functions.** They take state and return strings. No side effects. Testable.
- **Components are presentational.** They accept props, don't own game state. The hook is the boundary.
- **Solving = timeline reconstruction.** The player fills in gaps, not accuses suspects. See DESIGN.md.

## Testing

The Blue Parrot mystery is the universal fixture:
- `tests/state.test.ts` — unit tests exercising every action type, derived state, persistence round-trips, and a full evidence chain scenario
- `tests/live-play.ts` — end-to-end against real Claude API: examinations, NPC conversations (streaming), summarization, solution evaluation

When adding features, test against Blue Parrot first. It exercises every schema element.
