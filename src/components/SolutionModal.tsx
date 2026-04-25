/**
 * SolutionModal.tsx — Timeline reconstruction form
 *
 * Shows known moments as context, gaps as text fields for the player
 * to fill in. After submission, shows per-moment scores and feedback.
 */

import { useState } from "react";
import type { Mystery, Clue } from "../../types/mystery";
import type { Theory } from "../../types/state";

interface SolutionModalProps {
  mystery: Mystery;
  discoveredClues: Clue[];
  loading: boolean;
  lastTheory: Theory | null;
  onSolve: (answers: Record<string, string>, evidenceCited: string[]) => void;
  onClose: () => void;
}

export function SolutionModal({
  mystery,
  discoveredClues,
  loading,
  lastTheory,
  onSolve,
  onClose,
}: SolutionModalProps) {
  const gaps = mystery.solution.moments.filter((m) => !m.isKnown);
  const known = mystery.solution.moments.filter((m) => m.isKnown);

  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(gaps.map((g) => [g.id, ""])),
  );
  const [selectedClues, setSelectedClues] = useState<Set<string>>(new Set());

  const filledGaps = gaps.filter((g) => answers[g.id]?.trim());
  const canSubmit = filledGaps.length > 0 && !loading && !lastTheory;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSolve(answers, [...selectedClues]);
  };

  const toggleClue = (id: string) => {
    setSelectedClues((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const outcomeBadge = lastTheory
    ? {
        solved: { text: "Mystery Solved", style: "bg-green-900/60 text-green-300" },
        close: { text: "Getting Close", style: "bg-amber-900/60 text-amber-300" },
        wrong: { text: "Off the Mark", style: "bg-red-900/60 text-red-300" },
      }[lastTheory.outcome]
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-panel)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
          <h2 className="text-lg font-semibold tracking-wide text-[var(--text-primary)]">
            🔍 Reconstruct the Timeline
          </h2>
          {!lastTheory?.gameOver && (
            <button
              onClick={onClose}
              className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              ✕
            </button>
          )}
        </div>

        {/* Result display */}
        {lastTheory ? (
          <div className="px-6 py-6">
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`rounded px-3 py-1 text-xs font-semibold uppercase tracking-wider ${outcomeBadge?.style}`}
              >
                {outcomeBadge?.text}
              </span>
              <span className="text-sm text-[var(--text-muted)]">
                Score: {Math.round(lastTheory.score * 100)}%
              </span>
            </div>

            {/* Per-moment results */}
            <div className="mb-4 space-y-2">
              {lastTheory.momentResults.map((mr) => {
                const moment = mystery.solution.moments.find((m) => m.id === mr.momentId);
                const scoreColor =
                  mr.score >= 0.7 ? "text-green-400" : mr.score >= 0.4 ? "text-amber-400" : "text-red-400";
                const scoreIcon = mr.score >= 0.7 ? "✅" : mr.score >= 0.4 ? "🟡" : "❌";
                return (
                  <div key={mr.momentId} className="rounded bg-neutral-900 px-3 py-2">
                    <div className="flex items-center gap-2 text-xs">
                      <span>{scoreIcon}</span>
                      <span className="text-[var(--text-muted)]">{moment?.time}</span>
                      <span className={`font-medium ${scoreColor}`}>
                        {Math.round(mr.score * 100)}%
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-primary)]">{mr.feedback}</p>
                  </div>
                );
              })}
            </div>

            {/* Narrative */}
            <div className="mb-6 whitespace-pre-line text-sm leading-relaxed text-[var(--text-primary)]">
              {lastTheory.narrative}
            </div>

            {lastTheory.gameOver ? (
              <button
                onClick={onClose}
                className="w-full rounded bg-green-800 px-4 py-3 text-sm font-semibold text-green-100 transition-colors hover:bg-green-700"
              >
                Mystery Solved
              </button>
            ) : (
              <button
                onClick={onClose}
                className="w-full rounded bg-neutral-700 px-4 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-neutral-600"
              >
                Continue Investigating
              </button>
            )}
          </div>
        ) : (
          /* Timeline reconstruction form */
          <div className="px-6 py-5 space-y-4">
            <p className="text-xs text-[var(--text-muted)]">
              Fill in the gaps in the timeline. Known events are shown for context.
            </p>

            {/* Timeline moments */}
            {mystery.solution.moments.map((moment) => (
              <div key={moment.id}>
                {moment.isKnown ? (
                  /* Known moment — read-only context */
                  <div className="flex items-start gap-3 rounded bg-neutral-900/50 px-3 py-2">
                    <span className="shrink-0 text-xs font-mono text-[var(--text-muted)]">
                      {moment.time}
                    </span>
                    <span className="text-xs text-neutral-400">
                      {moment.knownDescription}
                    </span>
                  </div>
                ) : (
                  /* Gap — player fills in */
                  <div className="rounded border border-[var(--border-subtle)] px-3 py-3">
                    <div className="mb-1.5 flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-[var(--accent-clue)]">
                        {moment.time}
                      </span>
                      <span className="text-xs text-[var(--text-primary)]">
                        {moment.prompt}
                      </span>
                    </div>
                    <textarea
                      value={answers[moment.id] ?? ""}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [moment.id]: e.target.value }))
                      }
                      placeholder="What happened here?"
                      rows={2}
                      className="w-full rounded bg-[var(--bg-input)] px-3 py-2 font-mono text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none ring-1 ring-transparent transition-all focus:ring-amber-700"
                    />
                  </div>
                )}
              </div>
            ))}

            {/* Evidence */}
            {discoveredClues.length > 0 && (
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                  Cite your evidence
                </label>
                <div className="space-y-1.5">
                  {discoveredClues.map((clue) => (
                    <label
                      key={clue.id}
                      className="flex cursor-pointer items-start gap-2 rounded px-2 py-1.5 transition-colors hover:bg-neutral-800"
                    >
                      <input
                        type="checkbox"
                        checked={selectedClues.has(clue.id)}
                        onChange={() => toggleClue(clue.id)}
                        className="mt-0.5 accent-amber-600"
                      />
                      <span className="text-xs leading-relaxed text-[var(--text-primary)]">
                        {clue.description.length > 120
                          ? clue.description.slice(0, 117) + "..."
                          : clue.description}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`w-full rounded px-4 py-3 text-sm font-semibold uppercase tracking-wider transition-colors ${
                canSubmit
                  ? "bg-amber-700 text-white hover:bg-amber-600"
                  : "cursor-not-allowed bg-neutral-800 text-neutral-600"
              }`}
            >
              {loading ? "Evaluating..." : "Present Your Solution"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
