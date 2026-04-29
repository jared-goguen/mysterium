/**
 * LocationView.tsx — Immersive location exploration panel
 *
 * Displays the atmospheric location description, characters present,
 * previous examination results, and an examine input.
 * Discovered clues at this location are highlighted in amber.
 */

import { useState, useRef, useEffect } from "react";
import type { ClientLocation, ClientClue, ClientExaminable } from "../../types/client";
import { NarrativeText } from "./NarrativeText";

interface ExamineResult {
  query: string;
  narrative: string;
  clueFound: string | null;
}

interface LocationViewProps {
  location: ClientLocation;
  /** Full clue objects the player has already discovered. */
  discoveredClues: ClientClue[];
  /** Previous examination results at this location. */
  examineHistory: ExamineResult[];
  /** Characters present at this location (name + id). */
  charactersPresent: Array<{ id: string; name: string }>;
  /** Examinables currently available (prerequisite-filtered). */
  availableExaminables: ClientExaminable[];
  /** Text currently streaming from the examine response. Null when idle. */
  streamingText: string | null;
  /** Player query sent but not yet in examination history (shown optimistically). */
  pendingMessage: string | null;
  /** Whether an API call is in flight. */
  loading: boolean;
  onExamine: (query: string) => void;
  onTalkTo: (characterId: string) => void;
}

export function LocationView({
  location,
  discoveredClues,
  examineHistory,
  charactersPresent,
  availableExaminables,
  streamingText,
  pendingMessage,
  loading,
  onExamine,
  onTalkTo,
}: LocationViewProps) {
  const [query, setQuery] = useState("");
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll examination history to bottom when new results or streaming text arrive
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [examineHistory.length, streamingText]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || loading) return;
    onExamine(trimmed);
    setQuery("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = query.trim();
      if (!trimmed || loading) return;
      onExamine(trimmed);
      setQuery("");
    }
  }

  // Clues discovered at this specific location
  const cluesHere = discoveredClues.filter((c) => c.foundAt === location.id);

  return (
    <div className="flex h-full flex-col">
      {/* Atmospheric description — the main visual element */}
      <div className="px-6 py-6">
        <NarrativeText text={location.description} className="drop-cap" />
      </div>

      {/* Available examinables — subtle hints for the player */}
      {availableExaminables.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] px-6 py-3">
          <span className="noir-header">
            You notice:{" "}
          </span>
          {availableExaminables.map((ex, i) => (
            <span key={ex.id}>
              <button
                onClick={() => onExamine(ex.name)}
                className="text-sm italic text-[var(--text-secondary)] underline decoration-dotted underline-offset-2 hover:text-[var(--text-primary)] hover:decoration-solid transition-colors"
                title={ex.surfaceDetail}
              >
                {ex.name}
              </button>
              {i < availableExaminables.length - 1 && (
                <span className="text-[var(--text-muted)]">, </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Characters present */}
      {charactersPresent.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] px-6 py-3">
          <span className="noir-header">
            Characters present:{" "}
          </span>
          {charactersPresent.map((char, i) => (
            <span key={char.id}>
              <button
                onClick={() => onTalkTo(char.id)}
                className="text-sm text-[var(--text-primary)] underline decoration-dotted underline-offset-2 hover:text-[var(--accent-clue)] transition-colors"
              >
                {char.name}
              </button>
              {i < charactersPresent.length - 1 && (
                <span className="text-[var(--text-muted)]">, </span>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Examination history — scrollable */}
      <div className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--border-subtle)] px-6 py-4">
        {examineHistory.length === 0 ? (
          <p className="text-sm italic text-[var(--text-muted)]">
            Nothing examined yet. What catches your eye?
          </p>
        ) : (
          <div className="space-y-4">
            {examineHistory.map((result, i) => (
              <div key={i} className="space-y-2">
                {i > 0 && (
                  <div className="border-t border-[var(--border-subtle)] pt-4" />
                )}
                <p className="noir-header">
                  &rsaquo; {result.query}
                </p>
                <NarrativeText
                  text={result.narrative}
                  className={result.clueFound ? "narrative-clue-found" : ""}
                />
                {result.clueFound && (
                  <div className="gold-border-left gold-glow mt-2 flex items-center gap-2 rounded bg-amber-950/30 px-3 py-2">
                    <span className="text-amber-400">✦</span>
                    <span className="text-xs font-semibold tracking-wide text-[var(--accent-clue)]">
                      ✦ Clue discovered
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Pending examination query (sent but not yet in history) */}
            {pendingMessage && (
              <div className="space-y-2">
                {examineHistory.length > 0 && (
                  <div className="border-t border-[var(--border-subtle)] pt-4" />
                )}
                <p className="noir-header">
                  &rsaquo; {pendingMessage}
                </p>
                {streamingText !== null && (
                  <div className="streaming-cursor">
                    {streamingText ? (
                      <NarrativeText text={streamingText} />
                    ) : (
                      <p className="narrative animate-pulse text-[var(--accent-clue)]">…</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div ref={historyEndRef} />
          </div>
        )}
      </div>

      {/* Examine input */}
      <div className="border-t border-[var(--border-subtle)] px-6 py-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
            placeholder="What catches your eye?"
            className="flex-1 rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-neutral-600 outline-none focus:ring-1 focus:ring-[var(--accent-clue)]/50 disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="rounded bg-[var(--bg-surface)] px-4 py-2 text-sm text-[var(--text-primary)] transition-colors hover:bg-[var(--border-warm)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Examine
          </button>
        </form>
      </div>

      {/* Discovered clues at this location */}
      {cluesHere.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] bg-neutral-900/50 px-6 py-3">
          <p className="noir-header mb-2 text-[var(--accent-clue)] opacity-90">
            ✦ Evidence found here
          </p>
          <ul className="space-y-1">
            {cluesHere.map((clue) => (
              <li key={clue.id} className="text-sm text-[var(--accent-clue)] opacity-90">
                {clue.description}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
