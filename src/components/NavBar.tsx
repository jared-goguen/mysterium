/**
 * NavBar.tsx — Vertical left navigation sidebar
 *
 * Mystery title + genre badge, location list, persons of interest,
 * and bottom action buttons (solve / give up).
 */

import type { ClientMystery, ClientClue } from "../../types/client";
import type { FocusTarget } from "../../types/state";

interface NavBarProps {
  mystery: ClientMystery;
  focus: FocusTarget;
  visitedLocations: Set<string>;
  interviewedCharacters: Set<string>;
  discoveredClues: ClientClue[];
  npcStates: Record<string, { emotion: string; rapport: number }>;
  onMoveTo: (locationId: string) => void;
  onTalkTo: (characterId: string) => void;
  onSolve: () => void;
  onGiveUp: () => void;
}

const genreBadgeColors: Record<string, string> = {
  noir: "bg-neutral-700 text-neutral-300",
  gothic: "bg-purple-900/60 text-purple-300",
  cozy: "bg-amber-900/60 text-amber-300",
  scifi: "bg-cyan-900/60 text-cyan-300",
  historical: "bg-stone-700 text-stone-300",
  heist: "bg-red-900/60 text-red-300",
  fantasy: "bg-emerald-900/60 text-emerald-300",
};

const emotionEmoji: Record<string, string> = {
  nervous: "😰",
  calm: "😌",
  hostile: "😤",
  scared: "😨",
  suspicious: "🤨",
  cooperative: "🤝",
  angry: "😡",
  sad: "😢",
};


export function NavBar({
  mystery,
  focus,
  visitedLocations,
  interviewedCharacters,
  discoveredClues,
  npcStates,
  onMoveTo,
  onTalkTo,
  onSolve,
  onGiveUp,
}: NavBarProps) {
  const badgeColor =
    genreBadgeColors[mystery.genre] ?? "bg-neutral-700 text-neutral-300";

  const narrator = mystery.characters.find((c) => c.role === "narrator");
  const suspects = mystery.characters.filter((c) => c.role !== "narrator");

  return (
    <nav className="flex h-full flex-col bg-[var(--bg-panel)] overflow-y-auto">
      {/* ── Header: title + genre ── */}
      <div className="border-b border-[var(--border-subtle)] px-4 py-4">
        <h1
          className="text-base text-[var(--text-primary)]"
          style={{ fontFamily: "Georgia, serif" }}
        >
          {mystery.title}
        </h1>
        <span
          className={`mt-1.5 inline-block rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${badgeColor}`}
        >
          {mystery.genre}
        </span>
      </div>

      {/* ── Locations ── */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="px-4 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Locations
        </div>
        <div className="flex flex-col">
          {mystery.locations.map((loc) => {
            const isCurrent =
              focus.type === "location" && focus.id === loc.id;
            const isVisited = visitedLocations.has(loc.id);

            return (
              <button
                key={loc.id}
                onClick={() => onMoveTo(loc.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-[var(--bg-surface)] ${
                  isCurrent
                    ? "border-l-[3px] border-[var(--accent-clue)] bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "border-l-[3px] border-transparent text-[var(--text-muted)]"
                }`}
              >
                {isVisited && !isCurrent && (
                  <span className="mr-1.5 text-[var(--accent-clue)]">●</span>
                )}
                {loc.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Persons of Interest ── */}
      <div className="border-b border-[var(--border-subtle)]">
        <div className="px-4 pt-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
          Persons of Interest
        </div>
        <div className="flex flex-col">
          {/* Narrator pinned first */}
          {narrator && (
            <>
              <button
                onClick={() => onTalkTo(narrator.id)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors cursor-pointer hover:bg-[var(--bg-surface)] ${
                  focus.type === "character" && focus.id === narrator.id
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <span className="mr-1.5 text-xs">📋</span>
                Case Briefing
              </button>
              <div className="mx-4 border-b border-[var(--border-warm)]" />
            </>
          )}

          {/* Suspects */}
          {suspects.map((char) => {
            const isFocused =
              focus.type === "character" && focus.id === char.id;
            const npcState = npcStates[char.id];
            const emotion = npcState?.emotion ?? "suspicious";

            return (
              <button
                key={char.id}
                onClick={() => onTalkTo(char.id)}
                className={`w-full text-left px-4 py-2 transition-colors cursor-pointer hover:bg-[var(--bg-surface)] ${
                  isFocused
                    ? "bg-[var(--bg-surface)] text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                }`}
              >
                <div className="text-sm">{char.name.split(" ")[0]}</div>
                <div className="text-xs italic text-[var(--text-muted)]">
                  {emotion}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Bottom actions ── */}
      <div className="mt-auto px-4 py-4">
        <button
          onClick={onSolve}
          disabled={discoveredClues.length === 0}
          className={`w-full py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
            discoveredClues.length > 0
              ? "bg-[var(--accent-clue)] text-[var(--bg-primary)] hover:brightness-110 cursor-pointer"
              : "cursor-not-allowed opacity-40 bg-neutral-800 text-neutral-600"
          }`}
        >
          🔍 Solve Case
        </button>
        <button
          onClick={onGiveUp}
          className="mt-3 w-full text-center text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] cursor-pointer"
        >
          Give up
        </button>
      </div>
    </nav>
  );
}

