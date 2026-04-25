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

import type { MockGameState } from "../hooks/useMockGameState";
import { NavBar } from "./NavBar";
import { MainPanel } from "./MainPanel";
import { NotesPanel } from "./NotesPanel";
import { EventLog } from "./EventLog";

interface GameBoardProps {
  game: MockGameState;
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
