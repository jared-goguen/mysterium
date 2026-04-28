/**
 * MysteryCard.tsx — Presentational card for mystery selection UI
 *
 * Displays mystery title, genre badge, difficulty indicator,
 * description, and setting tagline.
 */

import type { MysteryListItem } from "../../types/client";

interface MysteryCardProps {
  mystery: MysteryListItem;
  onClick: () => void;
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

function DifficultyDots({ difficulty }: { difficulty: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Difficulty: ${difficulty} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-2 w-2 rounded-full ${
            i < difficulty
              ? "bg-[var(--text-primary)]"
              : "bg-neutral-700"
          }`}
        />
      ))}
    </div>
  );
}

export function MysteryCard({ mystery, onClick }: MysteryCardProps) {
  const badgeColor =
    genreBadgeColors[mystery.genre] ?? "bg-neutral-700 text-neutral-300";

  return (
    <button
      onClick={onClick}
      className="group w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)] p-4 text-left transition-colors hover:border-neutral-500 hover:bg-neutral-800"
    >
      {/* Header: title + genre badge */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-white">
          {mystery.title}
        </h3>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${badgeColor}`}
        >
          {mystery.genre}
        </span>
      </div>

      {/* Difficulty */}
      <div className="mb-3">
        <DifficultyDots difficulty={mystery.difficulty} />
      </div>

      {/* Description */}
      <p className="mb-3 text-xs leading-relaxed text-[var(--text-muted)]">
        {mystery.description}
      </p>

      {/* Setting tagline */}
      <p className="text-[11px] text-neutral-500">
        {mystery.setting.name} · {mystery.setting.era}
      </p>
    </button>
  );
}
