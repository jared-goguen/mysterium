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
        <div className="flex w-72 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--bg-panel)]">
          <div className="border-b border-[var(--border-subtle)] px-4 py-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
              📋 Investigation Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {game.eventLog.length === 0 ? (
              <p className="text-xs italic text-[var(--text-muted)]">
                Your investigation begins...
              </p>
            ) : (
              <ul className="space-y-2">
                {game.eventLog.map((entry, i) => (
                  <li key={i} className="text-xs">
                    <span className="mr-1">
                      {entry.type === "move" && "📍"}
                      {entry.type === "examine" && "🔎"}
                      {entry.type === "clue" && "🔍"}
                      {entry.type === "conversation" && "💬"}
                      {entry.type === "accusation" && "⚖️"}
                    </span>
                    <span
                      className={
                        entry.type === "clue"
                          ? "font-medium text-[var(--accent-clue)]"
                          : "text-[var(--text-muted)]"
                      }
                    >
                      {entry.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Center panel — Main interaction */}
        <MainPanel mystery={mystery} focus={gameState.focus} />

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
