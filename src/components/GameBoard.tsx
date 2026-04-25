/**
 * GameBoard.tsx — Top-level game screen
 *
 * Three-panel flexbox layout:
 * - Left (w-72): Event log
 * - Center (flex-1): Main interaction panel
 * - Right (w-80): Notes panel
 *
 * Plus the NavBar fixed at the bottom.
 */

import type { GameState } from "../../types/state";
import type { Mystery, Clue } from "../../types/mystery";
import type { EventEntry } from "../../lib/events";
import { NavBar } from "./NavBar";
import { MainPanel } from "./MainPanel";
import { NotesPanel } from "./NotesPanel";
import { EventLog } from "./EventLog";

/** Props accepted from either useMockGameState or useGameState. */
interface GameBoardProps {
  game: {
    gameState: GameState | null;
    mystery: Mystery | null;
    notes: string;
    eventLog: EventEntry[];
    discoveredClues: Clue[];
    visitedLocations: Set<string>;
    interviewedCharacters: Set<string>;
    progress: number;
    streamingText: string | null;
    loading: boolean;
    error: string | null;
    moveTo: (locationId: string) => void;
    examine: (query: string) => void;
    talkTo: (characterId: string) => void;
    sendMessage: (characterId: string, message: string) => void;
    endConversation: () => void;
    updateNotes: (text: string) => void;
  };
}

export function GameBoard({ game }: GameBoardProps) {
  const { mystery, gameState } = game;

  if (!mystery || !gameState) {
    return (
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <p className="text-[var(--text-muted)]">No active game.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--bg-primary)]">
      {/* Error banner */}
      {game.error && (
        <div className="shrink-0 bg-red-950/80 px-4 py-2 text-xs text-red-300">
          ⚠️ {game.error}
        </div>
      )}

      {/* Main three-panel area */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel — Event Log */}
        <div className="w-72 shrink-0 border-r border-[var(--border-subtle)]">
          <EventLog eventLog={game.eventLog} />
        </div>

        {/* Center panel — Main interaction */}
        <MainPanel
          mystery={mystery}
          focus={gameState.focus}
          explorations={gameState.explorations}
          conversations={gameState.conversations}
          npcStates={gameState.npcStates}
          discoveredClues={game.discoveredClues}
          streamingText={game.streamingText}
          loading={game.loading}
          onExamine={game.examine}
          onTalkTo={game.talkTo}
          onSendMessage={game.sendMessage}
          onEndConversation={game.endConversation}
        />

        {/* Right panel — Notes */}
        <NotesPanel notes={game.notes} onUpdateNotes={game.updateNotes} />
      </div>

      {/* Bottom navigation bar */}
      <NavBar
        mystery={mystery}
        focus={gameState.focus}
        visitedLocations={game.visitedLocations}
        interviewedCharacters={game.interviewedCharacters}
        discoveredClues={game.discoveredClues}
        npcStates={gameState.npcStates}
        onMoveTo={game.moveTo}
        onTalkTo={game.talkTo}
      />
    </div>
  );
}
