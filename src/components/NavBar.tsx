/**
 * NavBar.tsx — Fixed bottom navigation bar
 *
 * Mystery title + genre badge, location tabs, suspect buttons,
 * and the accusation button.
 */

import type { Mystery, Character, Location } from "../../types/mystery";
import type { Focus } from "../../types/state";
import type { Clue } from "../../types/mystery";

interface NavBarProps {
  mystery: Mystery;
  focus: Focus;
  visitedLocations: Set<string>;
  interviewedCharacters: Set<string>;
  discoveredClues: Clue[];
  npcStates: Record<string, { emotion: string; cooperativeness: number }>;
  onMoveTo: (locationId: string) => void;
  onTalkTo: (characterId: string) => void;
  onAccuse: () => void;
  onGiveUp: () => void;
}

const genreBadgeColors: Record<string, string> = {
  noir: "bg-neutral-700 text-neutral-300",
  gothic: "bg-purple-900/60 text-purple-300",
  cozy: "bg-amber-900/60 text-amber-300",
  scifi: "bg-cyan-900/60 text-cyan-300",
  historical: "bg-stone-700 text-stone-300",
  heist: "bg-red-900/60 text-red-300",
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
  onAccuse,
  onGiveUp,
}: NavBarProps) {
  const badgeColor = genreBadgeColors[mystery.genre] ?? "bg-neutral-700 text-neutral-300";

  return (
    <nav className="flex items-center gap-4 border-t border-[var(--border-subtle)] bg-neutral-925 px-4 py-2"
         style={{ background: "#111" }}>
      {/* Mystery title + genre */}
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {mystery.title}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${badgeColor}`}>
          {mystery.genre}
        </span>
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[var(--border-subtle)]" />

      {/* Location tabs */}
      <div className="flex items-center gap-1">
        {mystery.locations.map((loc) => {
          const isCurrent = focus.type === "location" && focus.id === loc.id;
          const isVisited = visitedLocations.has(loc.id);

          return (
            <button
              key={loc.id}
              onClick={() => onMoveTo(loc.id)}
              className={`relative rounded px-2.5 py-1 text-xs transition-colors ${
                isCurrent
                  ? "bg-neutral-700 text-[var(--text-primary)]"
                  : "text-[var(--text-muted)] hover:bg-neutral-800 hover:text-[var(--text-primary)]"
              }`}
            >
              {loc.name}
              {isVisited && !isCurrent && (
                <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--text-muted)]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="h-6 w-px bg-[var(--border-subtle)]" />

      {/* Suspect buttons */}
      <div className="flex items-center gap-1">
        {mystery.characters.map((char) => {
          const isFocused = focus.type === "character" && focus.id === char.id;
          const npcState = npcStates[char.id];
          const emotion = npcState?.emotion ?? "suspicious";
          const emoji = emotionEmoji[emotion] ?? "🤨";

          return (
            <button
              key={char.id}
              onClick={() => onTalkTo(char.id)}
              disabled={isFocused}
              className={`flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors ${
                isFocused
                  ? "cursor-default bg-neutral-700 text-[var(--text-muted)]"
                  : "text-[var(--text-muted)] hover:bg-neutral-800 hover:text-[var(--text-primary)]"
              }`}
            >
              <span className="text-[10px]">{emoji}</span>
              <span>{char.name.split(" ")[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Give up */}
      <button
        onClick={onGiveUp}
        className="text-xs text-neutral-600 transition-colors hover:text-neutral-400"
      >
        Give up
      </button>

      {/* Accusation button */}
      <button
        onClick={onAccuse}
        disabled={discoveredClues.length === 0}
        className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          discoveredClues.length > 0
            ? "bg-[var(--accent-danger)] text-white hover:bg-red-600"
            : "cursor-not-allowed bg-neutral-800 text-neutral-600"
        }`}
      >
        ⚖️ Accuse
      </button>
    </nav>
  );
}
