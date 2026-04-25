# Mysterium — Game Design

## Core Concept

A mystery is a broken timeline. Something happened — the player's job is to reconstruct it.

The fundamental question isn't "who did it?" but "what happened?" The player gathers evidence, talks to people who know fragments of the truth, spots contradictions between accounts, and assembles a complete picture of events.

Solving a mystery means demonstrating understanding, not pointing a finger.

## The Atomic Unit: Events

Everything that matters in a mystery is an **event** — something that happened at a specific time and place, involving specific people.

```
Event = Time + Location + People + What happened
```

Examples:
- *10:40 PM · Victor's Office · Dolores* → "Swapped Victor's whiskey glass with a poisoned one"
- *11:30 PM · Victor's Office · Frank* → "Found Victor dead, wiped down surfaces to remove his prints"
- *10:30 PM · Stockroom · Tommy* → "Doing inventory, couldn't see the back hallway"

Evidence in the game works by placing people at locations at times. Clues reveal or constrain events. Contradictions arise when two accounts of the same moment conflict — resolving them is the core gameplay loop.

## Mystery Structure

A mystery consists of:

**Characters** — People with partial knowledge of the truth. Each has something to hide (even innocents), relationships with other characters, and a version of events they'll share under questioning. Their testimony is the primary source of timeline information.

**Locations** — Places the player can explore. Each contains examinable objects, some hiding clues. The physical environment tells its own story.

**Clues** — Evidence that reveals or constrains timeline events. Physical clues (a receipt, a scent), documentary clues (a ticket stub, a letter), testimonial clues (something a character reveals), and forensic clues (timing, cause of death). Each clue either eliminates a possibility or confirms one.

**Contradictions** — Pairs of conflicting claims from different characters. Catching contradictions and confronting suspects with them is one of the most satisfying moments in the game. Each contradiction is resolvable by a specific clue.

**Timeline** — The sequence of events, both known and hidden. Known events provide context (the club opened, the body was found). Hidden events are the puzzle — what happened in the gaps?

**Solution** — The complete true timeline. The player solves the mystery by correctly reconstructing the hidden events.

## The Timeline Model

### Known Moments vs. Gaps

The mystery's timeline has two kinds of entries:

**Known moments** — shown to the player from the start. They provide the framework:
- "8:30 PM — Victor arrives at the club"
- "9:30 PM — Victor goes to his office"
- "12:30 AM — Tommy finds the body at closing time"

**Gaps** — hidden events the player must reconstruct through investigation:
- "10:30 PM — What happened during the break between sets?"
- "10:40 PM — What happened in Victor's office?"

Each gap has:
- A **prompt** guiding what the player needs to figure out
- A **ground truth** (location, people, description) used for evaluation
- **Supporting clues** that help reconstruct this moment
- A **weight** indicating how important this moment is to the overall solution

### How Solving Works

When the player is ready, they present their reconstruction of the timeline:

1. Known moments are shown for context (read-only)
2. Each gap has a freeform text field — the player writes what they think happened
3. The player cites evidence (discovered clues) supporting their theory
4. The AI evaluates each gap answer against the structured ground truth
5. Each gap receives a score (0–1) and feedback
6. The overall score is the weighted sum of gap scores
7. Thresholds determine the outcome: **solved** (≥ 0.75), **close** (0.4–0.75), **wrong** (< 0.4)

The solve form looks like a timeline with blanks to fill in — the player demonstrates their understanding of the complete sequence of events.

### Per-Moment Evaluation

The AI evaluates each answer on:
- **Key facts** — did the player identify the right people, location, and action?
- **Causal understanding** — does the player understand *why* this event happened?
- **Evidence connection** — is the answer supported by discoverable clues?

Partial credit is possible. "Frank went upstairs" scores higher than "nobody went upstairs" even if the player missed the detail about wiping down surfaces.

## Why Timeline, Not Accusation

The original design framed the endgame as "accuse a suspect." Timeline reconstruction is strictly better:

**It generalizes.** Not every mystery is a murder:
- *Heist*: reconstruct how the theft was executed, who played which role
- *Disappearance*: reconstruct the missing person's last known movements
- *Conspiracy*: reconstruct the chain of events behind the cover-up
- *Cold case*: reconstruct events from decades ago using fragmented evidence

**It rewards understanding over guessing.** Picking the right name from a list requires one bit of information. Reconstructing a timeline requires understanding the entire web of events, motives, and evidence.

**It creates richer feedback.** Instead of "right" or "wrong," the player learns which parts of the timeline they got right and where their understanding breaks down. This makes wrong attempts educational, not just punishing.

**It's more satisfying.** The "aha" moment isn't "it was Dolores!" — it's "Dolores entered through the back alley at 10:40 during the second set when Tommy was in the stockroom and Eddie was on the phone with her — THAT'S how she did it unseen." The player has assembled a coherent narrative, not just a name.

## Game Loop

```
Explore locations → Discover physical clues
     ↓
Talk to suspects → Hear their versions of events → Note contradictions
     ↓
Build mental timeline → Place people at locations at times
     ↓
Spot gaps → "What happened between 10:30 and 10:50?"
     ↓
Investigate gaps → Who fills them? What evidence constrains them?
     ↓
Present reconstruction → AI evaluates per-moment → Score + feedback
```

The investigation phase has no fixed ordering. The player can explore any location, talk to any character, and attempt to solve at any point. Clues discovered earlier may recontextualize later conversations. The game rewards curiosity and thoroughness.

## Social Dynamics

Suspects aren't static. The game world reacts to the investigation:

- **Word spreads.** After you interrogate someone, other suspects may hear about it. "I heard you were asking about the poison..."
- **NPCs have emotions.** They become nervous, hostile, or cooperative based on the investigation's progress and what you've asked.
- **Wrong theories have consequences.** Presenting a wrong reconstruction doesn't end the game, but NPCs react — the real culprit may become bolder or more careful, and innocent suspects may lose patience.
- **Every character has a secret.** Even innocent suspects hide something (an affair, a theft, a criminal record). This makes everyone seem suspicious and forces the player to distinguish real evasiveness from guilty evasiveness.

## Schema Overview

### Mystery (immutable, the "game cartridge")

```
Mystery
├── characters[]       — people with knowledge, secrets, alibis
├── locations[]        — places with examinable objects
├── clues[]            — discoverable evidence
├── contradictions[]   — conflicting claims between characters
├── timeline[]         — the true sequence of all events
├── redHerrings[]      — misleading evidence with innocent explanations
└── solution
    ├── truth          — full narrative of what happened
    ├── moments[]      — known moments + gaps (the puzzle)
    └── evidenceChain  — ordered clues that prove the solution
```

### GameState (mutable, the "save file")

```
GameState
├── explorations[]     — what the player examined at each location
├── conversations[]    — message history + summaries per character
├── theories[]         — timeline reconstruction attempts + results
├── npcStates{}        — current emotion / cooperativeness / awareness per NPC
└── focus              — where the player is right now (location or character)
```

### Actions (state transitions)

```
MOVE              → change location (no AI)
EXAMINE           → examine something at a location (Haiku)
TALK              → start talking to a character (no AI)
SAY               → send message to NPC (Sonnet streaming + Haiku clue detection)
END_CONVERSATION  → summarize + spread information (Haiku)
SOLVE             → present timeline reconstruction (Sonnet)
GIVE_UP           → reveal the full solution (Sonnet)
```

## Future Directions

- **AI mystery generation** — two-pass prompt (logical structure → atmospheric flesh) producing the moments-based schema
- **Multiple mystery types** — murder, heist, disappearance, conspiracy, each with different gap structures
- **Difficulty scaling** — more gaps, more red herrings, less cooperative NPCs
- **Multiplayer** — different players reconstruct the same mystery, compare scores
- **Replayable mysteries** — the same mystery can be played by different people (mystery = cartridge, game state = save file)
