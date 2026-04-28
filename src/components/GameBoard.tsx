/**
 * GameBoard.tsx — Top-level game screen
 *
 * Three-panel layout + SolutionModal overlay.
 */

import { useState, useCallback } from "react";
import type { ClientGameState, ClientMystery, ClientClue } from "../../types/client";
import type { EventEntry } from "../../lib/events";
import type { FocusTarget } from "../../types/actions";
import { NavBar } from "./NavBar";
import { MainPanel } from "./MainPanel";
import { NotesPanel } from "./NotesPanel";
import { EventLog } from "./EventLog";
import { SolutionModal } from "./SolutionModal";

export interface GameBoardProps {
  game: {
    gameState: ClientGameState | null;
    mystery: ClientMystery | null;
    notes: string;
    eventLog: EventEntry[];
    discoveredClues: ClientClue[];
    visitedLocations: Set<string>;
    interviewedCharacters: Set<string>;
    progress: number;
    streamingText: string | null;
    loading: boolean;
    error: string | null;
    focus: (target: FocusTarget) => void;
    interact: (message: string) => void;
    solve: (answers: Record<string, string>, evidenceCited: string[]) => void;
    giveUp: () => void;
    updateNotes: (text: string) => void;
  };
}

export function GameBoard({ game }: GameBoardProps) {
  const { mystery, gameState } = game;
  const [solutionOpen, setSolutionOpen] = useState(false);

  const handleFocusLocation = useCallback(
    (locationId: string) => game.focus({ type: "location", id: locationId }),
    [game.focus],
  );

  const handleFocusCharacter = useCallback(
    (characterId: string) => game.focus({ type: "character", id: characterId }),
    [game.focus],
  );

  if (!mystery || !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">No active game.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)]">
      {game.error && (
        <div className="shrink-0 bg-red-950/80 px-4 py-2 text-xs text-red-300">
          ⚠️ {game.error}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        <div className="w-72 shrink-0 border-r border-[var(--border-subtle)]">
          <EventLog eventLog={game.eventLog} />
        </div>

        <MainPanel
          mystery={mystery}
          focus={gameState.focus}
          gameState={gameState}
          explorations={gameState.explorations}
          conversations={gameState.conversations}
          npcStates={gameState.npcStates}
          discoveredClues={game.discoveredClues}
          streamingText={game.streamingText}
          loading={game.loading}
          pendingMessage={null}
          onExamine={game.interact}
          onTalkTo={handleFocusCharacter}
          onSendMessage={(_charId, msg) => game.interact(msg)}
          onEndConversation={() => {
            const loc = mystery.locations.find((l) =>
              l.charactersPresent.includes(gameState.focus.id),
            );
            game.focus({ type: "location", id: loc?.id ?? mystery.locations[0]!.id });
          }}
        />

        <NotesPanel notes={game.notes} onUpdateNotes={game.updateNotes} />
      </div>

      <NavBar
        mystery={mystery}
        focus={gameState.focus}
        visitedLocations={game.visitedLocations}
        interviewedCharacters={game.interviewedCharacters}
        discoveredClues={game.discoveredClues}
        npcStates={gameState.npcStates}
        onMoveTo={handleFocusLocation}
        onTalkTo={handleFocusCharacter}
        onSolve={() => setSolutionOpen(true)}
        onGiveUp={game.giveUp}
      />

      {solutionOpen && (
        <SolutionModal
          mystery={mystery}
          discoveredClues={game.discoveredClues}
          loading={game.loading}
          lastTheory={gameState.theories[gameState.theories.length - 1] ?? null}
          onSolve={game.solve}
          onClose={() => setSolutionOpen(false)}
        />
      )}
    </div>
  );
}
