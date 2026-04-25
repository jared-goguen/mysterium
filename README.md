# Mysterium

AI-powered interactive mystery game. Every mystery is unique — no spoilers possible.

Explore locations, interrogate suspects, discover clues, catch contradictions, and reconstruct the timeline of events. The AI roleplays every character, so no two investigations play the same.

See [DESIGN.md](DESIGN.md) for the full game design rationale.

## Quick Start

```bash
bun install
cp .env.example .env          # add your Anthropic API key
wrangler pages dev -- bunx vite  # local dev with real AI
```

Open http://localhost:8788.

To run with mock AI (no API key needed):

```bash
# In src/App.tsx, change import to useMockGameState
bunx vite
```

## Architecture

Three layers, clean separation:

```
types/          Contracts — Mystery, GameState, Actions
lib/            Game logic — state machine + AI engines
src/            React UI — components, hooks, styles
functions/      Cloudflare Pages Functions — API routes (Hono)
```

### The Two Core Objects

**Mystery** (immutable) — the generated world. Characters, locations, clues, contradictions, and a timeline of events with known moments and hidden gaps. Created once, never changes. This is the "game cartridge."

**GameState** (mutable) — the player's journey. Three append-only logs (explorations, conversations, theories) plus cached NPC states. Most derived state — discovered clues, visited locations, investigation progress — is computed as pure functions of the logs. This is the "save file."

### State Machine

Seven player actions, each producing a typed result:

| Action | AI Engine | Model | Returns |
|---|---|---|---|
| MOVE | — | — | Focus change |
| EXAMINE | Examiner | Haiku 4.5 | Narrative + clue |
| TALK | — | — | Focus change |
| SAY | Conversant | Sonnet 4.5 (streaming) | NPC response + clues |
| END_CONVERSATION | Summarizer | Haiku 4.5 | Summary + info spread |
| SOLVE | Judge | Sonnet 4.5 | Per-moment scores + narrative |
| GIVE_UP | Judge | Sonnet 4.5 | Solution reveal |

The game loop: `action → validate → AI engine → typed result → reducer → new state → render`.

### Solving a Mystery

The player solves by reconstructing the timeline — filling in the hidden gaps between known events. Each gap asks "what happened at this time?" and the player writes their answer based on evidence gathered during investigation.

The AI evaluates each answer against the structured ground truth. Per-moment scoring with weights produces an overall score: **solved** (≥ 0.75), **close** (0.4–0.75), or **wrong** (< 0.4). Wrong attempts have consequences (NPCs react) but the game continues.

### AI Engines

Each engine has separated layers:

- **Context builders** (`lib/ai/context.ts`) — select relevant state slices per engine
- **Prompt builders** (`lib/ai/prompts/`) — pure functions, testable without API calls
- **Engines** (`lib/ai/engines/`) — wire prompt → Claude API → validate → typed result
- **Tool schemas** (`lib/ai/tools.ts`) — structured output via Claude tool_use

NPC conversation is two-phase: Sonnet streams the roleplay response, then Haiku checks for testimonial clue revelations.

### UI

Three-panel layout: event log (left) | main interaction (center) | notes (right).

The center panel switches between `LocationView` (freeform examination) and `ChatPanel` (NPC conversation with streaming). A bottom `NavBar` provides location tabs, suspect buttons, and the "Solve" button.

Two hooks with the same interface:
- `useMockGameState` — local fuzzy matching, no API calls, instant responses
- `useGameState` — real AI via API routes, SSE streaming for chat

## Project Structure

```
mysterium/
├── DESIGN.md                  # Game design rationale
├── types/
│   ├── mystery.ts             # Mystery, Character, Location, Clue, Solution...
│   ├── state.ts               # GameState, Exploration, Conversation, Theory...
│   ├── actions.ts             # 7 actions + result types
│   └── index.ts
├── lib/
│   ├── initializers.ts        # createGameState(mystery)
│   ├── validators.ts          # validateAction(state, action)
│   ├── reducer.ts             # apply*(state, action, result) → GameState
│   ├── events.ts              # deriveEventLog(state) → EventEntry[]
│   ├── persistence.ts         # serialize / deserialize
│   ├── index.ts
│   └── ai/
│       ├── client.ts          # Anthropic wrapper (Haiku / Sonnet routing)
│       ├── tools.ts           # Tool schemas for structured output
│       ├── context.ts         # State slicers per engine
│       ├── prompts/           # Pure prompt builders
│       └── engines/           # API call wrappers
├── examples/
│   └── blue-parrot.ts         # Complete noir mystery (test fixture)
├── src/
│   ├── App.tsx                # Landing page + game screens
│   ├── hooks/
│   │   ├── useGameState.ts    # Real hook (API calls + streaming)
│   │   └── useMockGameState.ts # Mock hook (local, instant)
│   ├── components/
│   │   ├── GameBoard.tsx      # Three-panel layout
│   │   ├── EventLog.tsx       # Left panel — action history
│   │   ├── MainPanel.tsx      # Center — view switcher
│   │   ├── LocationView.tsx   # Examine locations
│   │   ├── ChatPanel.tsx      # NPC conversation (streaming)
│   │   ├── NotesPanel.tsx     # Right panel — freeform notes
│   │   ├── NavBar.tsx         # Bottom nav
│   │   └── SolutionModal.tsx  # Timeline reconstruction form
│   └── styles/
│       └── app.css            # Tailwind v4 + noir theme
├── functions/
│   └── api/[[route]].ts       # Hono API routes
├── tests/
│   ├── state.test.ts          # Unit tests (state machine)
│   └── live-play.ts           # Live API integration test
├── wrangler.toml
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Testing

```bash
bun test                        # unit tests (state machine)
bun run tests/live-play.ts      # live API test (~$0.03, needs API key)
bun run typecheck               # TypeScript strict mode
```

## Deployment

Deployed to Cloudflare Pages at https://mysterium.pages.dev.

```bash
bunx vite build                 # build to dist/
wrangler pages deploy dist      # deploy to Cloudflare Pages
```

GitHub Actions auto-deploys on push to `main` (typecheck → test → build → deploy).

The API key is set as a Pages secret (`wrangler pages secret put ANTHROPIC_API_KEY`).

## Mysteries

Mysteries are self-contained JSON-serializable objects conforming to the `Mystery` type. They can be saved, shared, and replayed — different players can play the same mystery with different states.

A mystery's solution is defined as a timeline of **moments** — known events (shown to the player) and hidden gaps (the puzzle). The player solves by reconstructing the gaps. See [DESIGN.md](DESIGN.md) for details.

The `examples/blue-parrot.ts` is a hand-crafted noir mystery used as the test fixture and default game.
